import {YouTubeApiClientInterface, YouTubeVideo} from "./youtube-api-client";
import {TwitterClientInterface} from "./twitter-client";
import {Context, ScheduledEvent} from "aws-lambda";

export class PlaylistWatcher {
  constructor(
    private readonly youtubeClient: YouTubeApiClientInterface,
    private readonly twitterClient: TwitterClientInterface,
    private readonly viewCountFactor: number,
    private readonly playlistId: string,
  ) {
  }

  handler = async (event: ScheduledEvent, context: Context) => {
    await this.notify()
  }

  async notify(): Promise<string[]> {
    const videos = await this.youtubeClient.fetchVideosInPlaylist(this.playlistId)
    const messages = videos
      .filter(video => isMultipleOf(video.viewCount, this.viewCountFactor))
      .map(this.notificationMessage)

    for (const message of messages) {
      await this.twitterClient.tweet(message)
    }
    return messages
  }

  notificationMessage = (video: YouTubeVideo) => {
    const videoUrl = `https://youtu.be/${video.videoId}`
    const viewCountRounded = video.viewCount - video.viewCount % this.viewCountFactor
    return `"${video.videoTitle}" の再生回数が "${viewCountRounded.toLocaleString()}" 回に到達しました。\n(現在 ${video.viewCount.toLocaleString()} 回)\n\n${videoUrl}`
  }
}


function isMultipleOf(a: number, b: number): boolean {
  return a % b === 0 && a !== 0
}
