import {google, youtube_v3} from 'googleapis'

export interface YouTubeApiClientInterface {
  fetchSubscriberCountOfChannel(channelId: string): Promise<number>

  fetchVideosInPlaylist(playlistId: string): Promise<YouTubeVideo[]>
}

export interface YouTubeVideo {
  videoId: string
  videoTitle: string
  viewCount: number
}

export class YouTubeApiClient implements YouTubeApiClientInterface {
  youtube = google.youtube({
    version: 'v3',
    auth: this.apiKey,
  })

  constructor(private apiKey: string) {
  }

  async fetchSubscriberCountOfChannel(channelId: string): Promise<number> {
    const response = await this.youtube.channels.list({
      id: [channelId],
      part: ['statistics'],
    })
    const items = response.data.items

    if (items.length === 0) {
      throw new Error(`No YouTube channel found for the ID: ${channelId}`)
    }
    return parseInt(items[0].statistics.subscriberCount)
  }

  async fetchVideosInPlaylist(playlistId: string): Promise<YouTubeVideo[]> {
    return this.fetchVideos(await this.fetchVideoIdsInPlaylist(playlistId))
  }

  async fetchVideoIdsInPlaylist(playlistId: string): Promise<string[]> {
    const response = await this.youtube.playlistItems.list({
      playlistId,
      part: ['contentDetails'],
      maxResults: 50,
    })
    return response.data.items.map(item => item.contentDetails.videoId)
  }

  async fetchVideos(videoIds: string[]): Promise<YouTubeVideo[]> {
    const response = await this.youtube.videos.list({
      id: videoIds,
      part: ['snippet', 'statistics'],
      maxResults: 50,
    })
    return response.data.items.map(item => ({
      videoId: item.id,
      viewCount: parseInt(item.statistics.viewCount),
      videoTitle: item.snippet.title
    }))
  }
}


