import {YoutubeApiClientMock} from "./youtube-api-client.mock";
import {TwitterClientMock} from "./twitter-client.mock";
import {Context, ScheduledEvent} from "aws-lambda";
import {SubscriberWatcher} from "../src/subscriber-watcher";

const youtube = new YoutubeApiClientMock()
const twitter = new TwitterClientMock()
const subscriberCountFactor = 100000;


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

describe('SubscriberWatcher.handler', () => {
  it('should successfully run', async () => {
    const channelId = '100k_sub'
    const handler = new SubscriberWatcher(youtube, twitter, subscriberCountFactor, channelId).handler
    await handler(event, context)
  })

  it('should successfully run', async () => {
    const channelId = '110k_sub'
    const handler = new SubscriberWatcher(youtube, twitter, subscriberCountFactor, channelId).handler
    await handler(event, context)
  })
})

describe('SubscriberWatcher.notify', () => {
  it('should return correct tweet messages', async () => {
    const channelId = '100k_sub'
    const messages = await new SubscriberWatcher(youtube, twitter, subscriberCountFactor, channelId).notify()
    const expected = ['リゼ様のYouTubeチャンネル登録者数が "100,000" 人に到達しました🎉']

    expect(messages).toEqual(expected)
  })

  it('should return correct tweet messages', async () => {
    const channelId = '1M_sub'
    const messages = await new SubscriberWatcher(youtube, twitter, subscriberCountFactor, channelId).notify()
    const expected = ['リゼ様のYouTubeチャンネル登録者数が "1,000,000" 人に到達しました🎉']

    expect(messages).toEqual(expected)
  })

  it('should return correct tweet messages', async () => {
    const channelId = '110k_sub'
    const messages = await new SubscriberWatcher(youtube, twitter, subscriberCountFactor, channelId).notify()
    const expected = []

    expect(messages).toEqual(expected)
  })

  it('should return correct tweet messages', async () => {
    const channelId = '0_sub'
    const messages = await new SubscriberWatcher(youtube, twitter, subscriberCountFactor, channelId).notify()
    const expected = []

    expect(messages).toEqual(expected)
  })
})
