import {DynamoDBStreamHandler, ScheduledHandler} from 'aws-lambda';
import 'source-map-support/register';

import {PlaylistWatcher} from "./playlist-watcher";
import {YouTubeApiClient} from "./youtube-api-client";
import {TwitterClient} from "./twitter-client";
import {SubscriberWatcher} from "./subscriber-watcher";
import {MentionWatcher} from "./mention-watcher";
import {DynamoDbClient} from "./dynamodb-client";

const youtubeApiKey = process.env.YOUTUBE_API_KEY ?? ''

const twitterApiKey = process.env.TWITTER_API_KEY ?? ''
const twitterApiSecret = process.env.TWITTER_API_SECRET ?? ''
const twitterAccessToken = process.env.TWITTER_ACCESS_TOKEN ?? ''
const twitterAccessSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET ?? ''

const channelId = process.env.YOUTUBE_CHANNEL_ID ?? ''
const playlistId = process.env.YOUTUBE_PLAYLIST_ID ?? ''

const subscriberCountFactor = parseInt(process.env.SUBSCRIBER_COUNT_FACTOR ?? '100000')
const viewCountFactor = parseInt(process.env.VIEW_COUNT_COUNT_FACTOR ?? '100000')

const youtube = new YouTubeApiClient(youtubeApiKey)
const twitter = new TwitterClient(twitterApiKey, twitterApiSecret, twitterAccessToken, twitterAccessSecret)

const region = process.env.DYNAMO_MILESTONE_TABLE_REGION ?? 'us-east-1'
const videoTableName = process.env.DYNAMO_MILESTONE_TABLE_NAME ?? ''
const dynamodb = new DynamoDbClient(region, videoTableName)

/**
 * This handler is scheduled at periodic intervals.
 * It retrieves view counts of videos in a specified YouTube playlist.
 *
 * @param event
 * @param context
 */
export const playlistWatcher: ScheduledHandler =
  new PlaylistWatcher(youtube, twitter, dynamodb, viewCountFactor, playlistId).handler

/**
 * This handler is scheduled at periodic intervals.
 * It retrieves subscribers count of a specified YouTube channel.
 *
 * @param event
 * @param context
 */
export const subscriberWatcher: ScheduledHandler =
  new SubscriberWatcher(youtube, twitter, dynamodb, subscriberCountFactor, channelId).handler

/**
 * This handler is triggered when a new YouTube video is added to DynamoDB.
 * It determines whether a specified YouTube channel is mentioned in the video description.
 *
 * @param event
 * @param context
 */
export const mentionWatcher: DynamoDBStreamHandler =
  new MentionWatcher(twitter, channelId).handler
