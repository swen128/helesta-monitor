import {Context, ScheduledEvent} from "aws-lambda";

import {PlaylistWatcher} from "../src/playlist-watcher";
import {YouTubeVideo} from "../src/youtube-api-client";
import {TwitterClientMock} from "./twitter-client.mock";
import {YoutubeApiClientMock} from "./youtube-api-client.mock";
import {MilestoneServiceMock} from "./milestone-service.mock"
import {Milestone} from "../src/milestone-service";

const twitter = new TwitterClientMock()

const event: ScheduledEvent = {
  version: "0",
  id: "53dc4d37-cffa-4f76-80c9-8b7d4a4d2eaa",
  "detail-type": "Scheduled Event",
  source: "aws.events",
  account: "123456789012",
  time: "2015-10-08T16:53:06Z",
  region: "us-east-1",
  resources: [
    "arn:aws:events:us-east-1:123456789012:rule/my-scheduled-rule"
  ],
  detail: {}
}
const context = {} as Context

const viewCountFactor = 100000
const subscriberCount = 0
const playlistId = 'placeholder'

describe("PlaylistWatcher.handler", () => {
  it("should succeed", async () => {
    const milestones: Milestone[] = [{
      url: 'https://youtu.be/3',
      achievedDate: new Date('2020-01-01T13:00:00Z'),
      count: 100000,
    }]

    const playlist: YouTubeVideo[] = [
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

    const milestoneService = new MilestoneServiceMock(milestones)
    const youtube = new YoutubeApiClientMock(subscriberCount, playlist)
    const handler = new PlaylistWatcher(youtube, twitter, milestoneService, viewCountFactor, playlistId).handler

    await handler(event, context)
  });
});

describe("PlaylistWatcher.notify", () => {
  it("should return correct tweet messages", async () => {
    const milestones: Milestone[] = [{
      url: 'https://youtu.be/videoId',
      achievedDate: new Date('2020-01-01T13:00:00Z'),
      count: 900000,
    }]
    const playlist: YouTubeVideo[] = [{
      videoId: 'videoId',
      videoTitle: 'video with 1M views',
      viewCount: 1012434,
    }]

    const milestoneService = new MilestoneServiceMock(milestones)
    const youtube = new YoutubeApiClientMock(subscriberCount, playlist)
    const watcher = new PlaylistWatcher(youtube, twitter, milestoneService, viewCountFactor, playlistId)

    const messages = await watcher.notify()
    expect(messages).toEqual([
      '【再生数記念】\nリゼ様の動画再生数が 100 万回に到達しました🎉\n\nvideo with 1M views\nhttps://youtu.be/videoId\n\n#リゼ・ヘルエスタ'
    ])
  });

  it("should return nothing when no milestone record is found", async () => {
    const milestones: Milestone[] = []
    const playlist: YouTubeVideo[] = [{
      videoId: 'videoId',
      videoTitle: 'video with 1M views',
      viewCount: 1012434,
    }]

    const milestoneService = new MilestoneServiceMock(milestones)
    const youtube = new YoutubeApiClientMock(subscriberCount, playlist)
    const watcher = new PlaylistWatcher(youtube, twitter, milestoneService, viewCountFactor, playlistId)

    const messages = await watcher.notify()
    expect(messages).toEqual([])
  });
})
