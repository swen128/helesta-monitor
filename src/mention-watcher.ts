import {TwitterClientInterface} from "./twitter-client";
import {Context, DynamoDBStreamEvent} from "aws-lambda";

import {Marshaller} from '@aws/dynamodb-auto-marshaller';

const marshaller = new Marshaller()

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
      .map(record => marshaller.unmarshallItem(record.dynamodb.NewImage) as unknown as YouTubeVideo)

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
