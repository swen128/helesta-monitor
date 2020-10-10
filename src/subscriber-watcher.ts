import {YouTubeApiClientInterface} from "./youtube-api-client";
import {TwitterClientInterface} from "./twitter-client";
import {Context, ScheduledEvent} from "aws-lambda";

export class SubscriberWatcher {
  constructor(
    private readonly youtubeClient: YouTubeApiClientInterface,
    private readonly twitterClient: TwitterClientInterface,
    private readonly subscriberCountFactor: number,
    private readonly channelId: string,
  ) {
  }

  handler = async (event: ScheduledEvent, context: Context) => {
    await this.notify()
  }

  async notify(): Promise<string[]> {
    const n = await this.youtubeClient.fetchSubscriberCountOfChannel(this.channelId)

    if (isMultipleOf(n, this.subscriberCountFactor)) {
      const message = this.notificationMessage(n)
      await this.twitterClient.tweet(message)
      return [message]
    } else {
      return []
    }
  }

  notificationMessage(subscriberCount: number): string {
    return `リゼ様のYouTubeチャンネル登録者数が "${subscriberCount.toLocaleString()}" 人に到達しました🎉`
  }
}

function isMultipleOf(a: number, b: number): boolean {
  return a % b === 0 && a !== 0
}
