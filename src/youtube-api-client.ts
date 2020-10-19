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

    if (!items || items.length === 0) {
      throw new Error(`No YouTube channel found for the ID: ${channelId}`)
    }

    const count = items[0].statistics?.subscriberCount

    if (count == undefined) {
      throw new Error(`The YouTube Data API (Channels:list) returned unexpected format.
       It did not contain $.data.items[0].statistics.subscriberCount: ${response}`)
    }
    return parseInt(count)
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
    const items = response.data?.items ?? []
    return items
      .map(item => item.contentDetails?.videoId)
      .filter(isString)
  }

  async fetchVideos(videoIds: string[]): Promise<YouTubeVideo[]> {
    const response = await this.youtube.videos.list({
      id: videoIds,
      part: ['snippet', 'statistics'],
      maxResults: 50,
    })
    const items = response.data?.items ?? []
    return items.map(item => ({
      videoId: item.id ?? '',
      viewCount: parseInt(item.statistics?.viewCount ?? '0'),
      videoTitle: item.snippet?.title ?? ''
    }))
  }
}


function isString(x: unknown): x is string {
  return typeof x === 'string'
}