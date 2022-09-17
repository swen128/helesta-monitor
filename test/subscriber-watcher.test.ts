import {Context, ScheduledEvent} from "aws-lambda";
import {Milestone} from "../src/milestone-service";
import {SubscriberWatcher} from "../src/subscriber-watcher";
import {MilestoneServiceMock} from "./milestone-service.mock";
import {TwitterClientMock} from "./twitter-client.mock";
import {YoutubeApiClientMock} from "./youtube-api-client.mock";

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

const subscriberCountFactor = 100000
const channelId = 'placeholder'
const channelUrl = `https://www.youtube.com/channel/${channelId}`

describe("SubscriberWatcher.handler", () => {
  it("should succeed", async () => {
    const subscriberCount = 1000000
    const milestones: Milestone[] = [{
      url: channelUrl,
      achievedDate: new Date('2020-01-01T13:00:00Z'),
      count: 90000,
    }]

    const milestoneService = new MilestoneServiceMock(milestones)
    const youtube = new YoutubeApiClientMock(subscriberCount, [])
    const watcher = new SubscriberWatcher(youtube, twitter, milestoneService, subscriberCountFactor, channelId)

    await watcher.handler(event, context)
  });
});

describe("SubscriberWatcher.notify", () => {
  it("should return a correct tweet message", async () => {
    const subscriberCount = 1000000
    const milestones: Milestone[] = [{
      url: channelUrl,
      achievedDate: new Date('2020-01-01T13:00:00Z'),
      count: 900000,
    }]

    const milestoneService = new MilestoneServiceMock(milestones)
    const youtube = new YoutubeApiClientMock(subscriberCount, [])
    const watcher = new SubscriberWatcher(youtube, twitter, milestoneService, subscriberCountFactor, channelId)

    const messages = await watcher.notify()
    expect(messages).toEqual([
      '【チャンネル登録者数記念】\nヘルエスタ王国第二皇女、リゼ様のYouTubeチャンネル登録者数が 100 万人に到達しました🎉\n\n#リゼ・ヘルエスタ'
    ])
  });

  it("should return nothing when milestone is not reached", async () => {
    const subscriberCount = 110000
    const milestones: Milestone[] = [{
      url: channelUrl,
      achievedDate: new Date('2020-01-01T13:00:00Z'),
      count: 100000,
    }]

    const milestoneService = new MilestoneServiceMock(milestones)
    const youtube = new YoutubeApiClientMock(subscriberCount, [])
    const watcher = new SubscriberWatcher(youtube, twitter, milestoneService, subscriberCountFactor, channelId)

    const messages = await watcher.notify()
    expect(messages).toEqual([])
  });

  it("should return nothing when no milestone record is found", async () => {
    const subscriberCount = 110000
    const milestones: Milestone[] = []

    const milestoneService = new MilestoneServiceMock(milestones)
    const youtube = new YoutubeApiClientMock(subscriberCount, [])
    const watcher = new SubscriberWatcher(youtube, twitter, milestoneService, subscriberCountFactor, channelId)

    const messages = await watcher.notify()
    expect(messages).toEqual([])
  });
})
