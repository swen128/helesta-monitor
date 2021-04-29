import {Context, DynamoDBStreamEvent} from "aws-lambda";
import {Converter} from "aws-sdk/clients/dynamodb";
import dedent from "ts-dedent";

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
    try {
      const newVideos = event.Records
        .filter(record => record.eventName === 'INSERT')
        .map(record => Converter.unmarshall(record.dynamodb?.NewImage ?? {}) as unknown)
        .filter<YouTubeVideo>(isYouTubeVideo)

      const messages = this.notificationMessages(newVideos)

      for (const message of messages) {
        await this.twitterClient.tweet(message)
      }
    } catch (e) {
      console.error(e)
    }
  }

  notificationMessages(videos: YouTubeVideo[]): string[] {
    const channelUrl = `https://www.youtube.com/channel/${this.channelId}`

    return videos
      .filter(video => video.description.includes(this.channelId))
      .filter(video => video.channel_url != channelUrl)
      .map(this.notificationMessage)
  }

  notificationMessage(video: YouTubeVideo): string {
    return dedent`【出演情報】
                  次の動画にリゼ様が出演予定です
                  
                  ${video.title}
                  ${video.url}
                  
                  #リゼ・ヘルエスタ`
  }
}

function isYouTubeVideo(x: any): x is YouTubeVideo {
  return typeof x === 'object' && x != null &&
    [x.url, x.title, x.channel_url, x.channel_title, x.description].every(
      value => typeof value === 'string'
    )
}
