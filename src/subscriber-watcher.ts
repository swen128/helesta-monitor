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
      const mes = message(n)
      await this.twitterClient.tweet(mes)
      return [mes]
    } else {
      return []
    }
  }
}

function message(n: number): string {
  return `チャンネル登録者数が ${n} 人に達しました🎉`
}

function isMultipleOf(a: number, b: number): boolean {
  return a % b === 0 && a !== 0
}
