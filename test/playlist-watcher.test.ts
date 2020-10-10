import {YoutubeApiClientMock} from "./youtube-api-client.mock";
import {TwitterClientMock} from "./twitter-client.mock";
import {Context, ScheduledEvent} from "aws-lambda";
import {PlaylistWatcher} from "../src/playlist-watcher";

const youtube = new YoutubeApiClientMock()
const twitter = new TwitterClientMock()
const viewCountFactor = 100000;
const playlistId = 'placeholder'

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

describe('PlaylistWatcher.handler', () => {
  it('should successfully run', async () => {
    const handler = new PlaylistWatcher(youtube, twitter, viewCountFactor, playlistId).handler
    await handler(event, context)
  })
})

describe('PlaylistWatcher.notify', () => {
  it('should return correct tweet messages', async () => {
    const messages = await new PlaylistWatcher(youtube, twitter, viewCountFactor, playlistId).notify()
    const expected = [
      '"video with 100k views" の再生回数が "100,000" 回に到達しました。\n(現在 100,000 回)\n\nhttps://youtu.be/1',
      '"video with 1M views" の再生回数が "1,000,000" 回に到達しました。\n(現在 1,000,000 回)\n\nhttps://youtu.be/2'
    ]

    expect(messages.sort()).toEqual(expected.sort())
  })
})
