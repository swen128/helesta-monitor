import {YouTubeApiClientInterface, YouTubeVideo} from "../src/youtube-api-client";

export class YoutubeApiClientMock implements YouTubeApiClientInterface {
  constructor(
    private readonly subscriberCount: number,
    private readonly playlist: YouTubeVideo[],
  ) {}

  async fetchSubscriberCountOfChannel(channelId: string): Promise<number> {
    return this.subscriberCount

    switch (channelId) {
      case '100k_sub':
        return 100000
      case '1M_sub':
        return 1000000
      case '110k_sub':
        return 110000
      case '0_sub':
        return 0
      default:
        throw new Error(`No YouTube channel found for the ID: ${channelId}`)
    }
  }

  async fetchVideosInPlaylist(playlistId: string): Promise<YouTubeVideo[]> {
    return this.playlist

    return [
      {
        videoId: '1',
        videoTitle: 'video with 100k views',
        viewCount: 102434,
      },
      {
        videoId: '2',
        videoTitle: 'video with 1M views',
        viewCount: 1012434,
      },
      {
        videoId: '3',
        videoTitle: 'video with 110k views',
        viewCount: 110000,
      },
      {
        videoId: '4',
        videoTitle: 'video with 0 views',
        viewCount: 0,
      },
    ]
  }
}
