import {Context, ScheduledEvent} from "aws-lambda";
import dedent from 'ts-dedent';

import {YouTubeApiClientInterface, YouTubeVideo} from "./youtube-api-client";
import {TwitterClientInterface} from "./twitter-client";
import {DynamoDbClient} from "./dynamodb-client";

export class PlaylistWatcher {
  constructor(
    private readonly youtubeClient: YouTubeApiClientInterface,
    private readonly twitterClient: TwitterClientInterface,
    private readonly dynamoDbClient: DynamoDbClient,
    private readonly viewCountFactor: number,
    private readonly playlistId: string,
  ) {
  }

  handler = async (event: ScheduledEvent, context: Context) => {
    const messages = await this.notify()
    console.log(`Tweeted messages:\n${messages.join('\n')}`)
  }

  async notify(): Promise<string[]> {
    const videos = await this.youtubeClient.fetchVideosInPlaylist(this.playlistId)
    const messages = []

    for (const video of videos) {
      console.log(`view count: ${video.viewCount}, video title: ${video.videoTitle}`)

      const videoUrl = `https://youtu.be/${video.videoId}`
      const lastMilestone = await this.dynamoDbClient.getLastMilestone(videoUrl)
      const newMilestone = {
        url: videoUrl,
        count: video.viewCount - video.viewCount % this.viewCountFactor,
        achievedDate: new Date(),
      }

      if (lastMilestone === undefined) {
        await this.dynamoDbClient.saveMilestone(newMilestone)
      } else if (newMilestone.count > lastMilestone.count) {
        const message = this.notificationMessage(video)
        messages.push(message)

        await this.twitterClient.tweet(message)
        await this.dynamoDbClient.saveMilestone(newMilestone)
      }
    }
    return messages
  }

  notificationMessage = (video: YouTubeVideo) => {
    const videoUrl = `https://youtu.be/${video.videoId}`
    const viewCountRounded = video.viewCount - video.viewCount % this.viewCountFactor

    return dedent`【再生数記念】
                  リゼ様の動画再生数が ${viewCountRounded.toLocaleString()} 回に到達しました🎉
                  
                  ${video.videoTitle}
                  ${videoUrl}
                  
                  #リゼ・ヘルエスタ`
  }
}
