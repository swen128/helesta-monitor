import {Context, ScheduledEvent} from "aws-lambda";
import dedent from 'ts-dedent';

import {YouTubeApiClientInterface, YouTubeVideo} from "./youtube-api-client";
import {TwitterClientInterface} from "./twitter-client";
import {DynamoDbClient} from "./dynamodb-client";

export function handler(
  youtubeClient: YouTubeApiClientInterface,
  twitterClient: TwitterClientInterface,
  dynamoDbClient: DynamoDbClient,
  viewCountFactor: number,
  playlistId: string,
) {
  return async (event: ScheduledEvent, context: Context) => {
    const messages = await notify(youtubeClient, twitterClient, dynamoDbClient, viewCountFactor, playlistId)
    console.log(`Tweeted messages:\n${messages.join('\n')}`)
  }
}

export async function notify(
  youtubeClient: YouTubeApiClientInterface,
  twitterClient: TwitterClientInterface,
  dynamoDbClient: DynamoDbClient,
  viewCountFactor: number,
  playlistId: string,
): Promise<string[]> {

  const videos = await youtubeClient.fetchVideosInPlaylist(playlistId)
  const messages = []

  for (const video of videos) {
    console.log(`view count: ${video.viewCount}, video title: ${video.videoTitle}`)

    const videoUrl = `https://youtu.be/${video.videoId}`
    const lastMilestone = await dynamoDbClient.getLastMilestone(videoUrl)
    const newMilestone = {
      url: videoUrl,
      count: video.viewCount - video.viewCount % viewCountFactor,
      achievedDate: new Date(),
    }

    if (lastMilestone === undefined) {
      await dynamoDbClient.saveMilestone(newMilestone)
    } else if (newMilestone.count > lastMilestone.count) {
      const message = notificationMessage(video, viewCountFactor)
      messages.push(message)

      await twitterClient.tweet(message)
      await dynamoDbClient.saveMilestone(newMilestone)
    }
  }
  return messages
}

function notificationMessage(video: YouTubeVideo, viewCountFactor: number) {
  const videoUrl = `https://youtu.be/${video.videoId}`
  const viewCountRounded = video.viewCount - video.viewCount % viewCountFactor

  return dedent`【再生数記念】
                  リゼ様の動画再生数が ${viewCountRounded / 10000} 万回に到達しました🎉
                  
                  ${video.videoTitle}
                  ${videoUrl}
                  
                  #リゼ・ヘルエスタ`
}
