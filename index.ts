import * as pulumi from '@pulumi/pulumi'
import * as aws from '@pulumi/aws'
import {YouTubeApiClient} from "./src/youtube-api-client"
import {TwitterClient} from "./src/twitter-client"
import {PlaylistWatcher} from "./src/playlist-watcher"
import {DynamoDbClient} from "./src/dynamodb-client"
import {SubscriberWatcher} from "./src/subscriber-watcher"
import {MentionWatcher} from "./src/mention-watcher"

const videoTableName = 'Videos-prod'
const videoTable = aws.dynamodb.Table.get("Video", videoTableName)

const config = new pulumi.Config()
const awsConfig = new pulumi.Config('aws')

const playlistWatcherSchedule = config.require("playlist_watcher_schedule")
const subscriberWatcherSchedule = config.require("subscriber_watcher_schedule")

const playlistId = config.require('youtube_playlist_id')
const channelId = config.require('youtube_channel_id')
const subscriberCountFactor = config.requireNumber('subscriber_count_factor')
const viewCountFactor = config.requireNumber('view_count_factor')

const milestoneTableRegion = awsConfig.require('region')
const milestoneTable = new aws.dynamodb.Table("Milestone", {
  attributes: [
    {name: "url", type: "S"},
    {name: "count", type: "N"},
  ],
  hashKey: "url",
  rangeKey: "count",
  readCapacity: 1,
  writeCapacity: 1,
})

const env = {
  variables: {
    YOUTUBE_API_KEY: config.requireSecret('youtube_api_key'),

    TWITTER_API_KEY: config.requireSecret('twitter_api_key'),
    TWITTER_API_SECRET: config.requireSecret('twitter_api_secret'),
    TWITTER_ACCESS_TOKEN: config.requireSecret('twitter_access_token'),
    TWITTER_ACCESS_TOKEN_SECRET: config.requireSecret('twitter_access_token_secret'),

    MILESTONE_TABLE_NAME: milestoneTable.name,
  }
}

const playlistWatcherFunction =
  new aws.lambda.CallbackFunction("PlaylistWatcherFunction", {
    callback: async (event, context) => {
      const youtubeApiKey = process.env.YOUTUBE_API_KEY ?? ''

      const twitterApiKey = process.env.TWITTER_API_KEY ?? ''
      const twitterApiSecret = process.env.TWITTER_API_SECRET ?? ''
      const twitterAccessToken = process.env.TWITTER_ACCESS_TOKEN ?? ''
      const twitterAccessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET ?? ''

      const milestoneTableName = process.env.MILESTONE_TABLE_NAME ?? ''

      const youtube = new YouTubeApiClient(youtubeApiKey)
      const twitter = new TwitterClient(twitterApiKey, twitterApiSecret, twitterAccessToken, twitterAccessSecret)
      const dynamodb = new DynamoDbClient(milestoneTableRegion, milestoneTableName)

      const handler = new PlaylistWatcher(youtube, twitter, dynamodb, viewCountFactor, playlistId).handler
      // @ts-ignore
      await handler(event, context)
    },
    environment: env,
  })

const subscriberWatcherFunction =
  new aws.lambda.CallbackFunction("SubscriberWatcherFunction", {
    callback: async (event, context) => {
      const youtubeApiKey = process.env.YOUTUBE_API_KEY ?? ''

      const twitterApiKey = process.env.TWITTER_API_KEY ?? ''
      const twitterApiSecret = process.env.TWITTER_API_SECRET ?? ''
      const twitterAccessToken = process.env.TWITTER_ACCESS_TOKEN ?? ''
      const twitterAccessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET ?? ''

      const milestoneTableName = process.env.MILESTONE_TABLE_NAME ?? ''

      const youtube = new YouTubeApiClient(youtubeApiKey)
      const twitter = new TwitterClient(twitterApiKey, twitterApiSecret, twitterAccessToken, twitterAccessSecret)
      const dynamodb = new DynamoDbClient(milestoneTableRegion, milestoneTableName)

      const handler = new SubscriberWatcher(youtube, twitter, dynamodb, subscriberCountFactor, channelId).handler
      // @ts-ignore
      await handler(event, context)
    },
    environment: env,
  })

const mentionWatcherFunction =
  new aws.lambda.CallbackFunction("MentionWatcherFunction", {
    callback: async (event, context) => {
      const twitterApiKey = process.env.TWITTER_API_KEY ?? ''
      const twitterApiSecret = process.env.TWITTER_API_SECRET ?? ''
      const twitterAccessToken = process.env.TWITTER_ACCESS_TOKEN ?? ''
      const twitterAccessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET ?? ''

      const twitter = new TwitterClient(twitterApiKey, twitterApiSecret, twitterAccessToken, twitterAccessSecret)

      const handler = new MentionWatcher(twitter, channelId).handler
      // @ts-ignore
      await handler(event, context)
    },
    environment: env,
  })

aws.cloudwatch.onSchedule("PlaylistWatcher", playlistWatcherSchedule, playlistWatcherFunction)
aws.cloudwatch.onSchedule("SubscriberWatcher", subscriberWatcherSchedule, subscriberWatcherFunction)
videoTable.onEvent('MentionWatcher', mentionWatcherFunction, {startingPosition: "LATEST"})
