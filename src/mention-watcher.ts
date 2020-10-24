import {Context, DynamoDBStreamEvent} from "aws-lambda";
import {Converter} from "aws-sdk/clients/dynamodb";

import {TwitterClientInterface} from "./twitter-client";

interface YouTubeVideo {
  url: string
  title: string
  channel_url: string
  channel_title: string
  description: string
}

export class MentionWatcher {
  constructor(
    private readonly twitterClient: TwitterClientInterface,
    private readonly channelId: string,
  ) {
  }

  handler = async (event: DynamoDBStreamEvent, context: Context) => {
    const newVideos = event.Records
      .filter(record => record.eventName === 'INSERT')
      .map(record => Converter.unmarshall(record.dynamodb?.NewImage ?? {}) as unknown)
      .filter<YouTubeVideo>(isYouTubeVideo)

    const messages = this.notificationMessages(newVideos)

    for (const message of messages) {
      await this.twitterClient.tweet(message)
    }
  }

  notificationMessages(videos: YouTubeVideo[]): string[] {
    return videos
      .filter(video => video.description.includes(this.channelId))
      .map(video => `"${video.title}" にリゼ様が出演予定です\n#リゼ・ヘルエスタ\n\n${video.url}`)
  }
}

function isYouTubeVideo(x: any): x is YouTubeVideo {
  return typeof x === 'object' && x != null &&
    [x.url, x.title, x.channel_url, x.channel_title, x.description].every(
      value => typeof value === 'string'
    )
}
