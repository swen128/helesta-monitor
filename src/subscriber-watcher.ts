import {Context, ScheduledEvent} from "aws-lambda";
import dedent from "ts-dedent";

import {YouTubeApiClientInterface} from "./youtube-api-client";
import {TwitterClientInterface} from "./twitter-client";
import {DynamoDbClient} from "./dynamodb-client";
import {MilestoneService} from "./milestone-service";

export class SubscriberWatcher {
  constructor(
    private readonly youtubeClient: YouTubeApiClientInterface,
    private readonly twitterClient: TwitterClientInterface,
    private readonly milestoneService: MilestoneService,
    private readonly subscriberCountFactor: number,
    private readonly channelId: string,
  ) {
  }

  handler = async (event: ScheduledEvent, context: Context) => {
    await this.notify()
  }

  async notify(): Promise<string[]> {
    const count = await this.youtubeClient.fetchSubscriberCountOfChannel(this.channelId)

    console.log(`Subscriber count of the channel (${this.channelId}): ${count}`)

    const channelUrl = `https://www.youtube.com/channel/${this.channelId}`
    const lastMilestone = await this.milestoneService.getLastMilestone(channelUrl)
    const newMilestone = {
      url: channelUrl,
      count: count - count % this.subscriberCountFactor,
      achievedDate: new Date(),
    }

    if (lastMilestone === undefined) {
      await this.milestoneService.saveMilestone(newMilestone)
      return []
    }

    if (newMilestone.count > lastMilestone.count) {
      const message = this.notificationMessage(newMilestone.count)
      await this.twitterClient.tweet(message)
      await this.milestoneService.saveMilestone(newMilestone)

      return [message]
    }

    return []
  }

  notificationMessage(subscriberCount: number): string {
    return dedent`【チャンネル登録者数記念】
                  ヘルエスタ王国第二皇女、リゼ様のYouTubeチャンネル登録者数が ${subscriberCount / 10000} 万人に到達しました🎉
                  
                  #リゼ・ヘルエスタ`
  }
}
