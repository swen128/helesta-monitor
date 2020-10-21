import AWSMock from "aws-sdk-mock";
import AWS from "aws-sdk";
import {Context, ScheduledEvent} from "aws-lambda";
import {PutItemInput, QueryInput} from "aws-sdk/clients/dynamodb";

import {DynamoDbClient} from "../src/dynamodb-client";
import {SubscriberWatcher} from "../src/subscriber-watcher";
import {TwitterClientMock} from "./twitter-client.mock";
import {YoutubeApiClientMock} from "./youtube-api-client.mock";

const youtube = new YoutubeApiClientMock()
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

const region = 'placeholder-region'
const tableName = 'Placeholder'

const subscriberCountFactor = 100000

describe("SubscriberWatcher.handler", () => {
  beforeEach(() => {
    AWSMock.setSDKInstance(AWS);
  })

  afterEach(() => {
    AWSMock.restore('DynamoDB')
  })

  it("should succeed", async () => {
    AWSMock.mock('DynamoDB', 'query', (params: QueryInput, callback: Function) => {
      callback(null, {
        Items: [{
          url: {'S': 'https://www.youtube.com/channel/UCZ1xuCK1kNmn5RzPYIZop3w'},
          achievedDate: {'S': '2020-01-01T13:00:00Z'},
          count: {'N': 100000},
        }]
      });
    })
    AWSMock.mock('DynamoDB', 'putItem', (params: PutItemInput, callback: Function) => {
      expect(params.TableName).toEqual(tableName)

      const item = AWS.DynamoDB.Converter.unmarshall(params.Item)
      expect(typeof item.url).toEqual("string")
      expect(typeof item.achievedDate).toEqual("string")
      expect(typeof item.count).toEqual("number")

      callback(null);
    })

    const dynamo = new DynamoDbClient(region, tableName)
    const channelId = '1M_sub'
    const watcher = new SubscriberWatcher(youtube, twitter, dynamo, subscriberCountFactor, channelId)

    await watcher.handler(event, context)
  });
});

describe("SubscriberWatcher.notify", () => {
  beforeEach(() => {
    AWSMock.setSDKInstance(AWS);
  })

  afterEach(() => {
    AWSMock.restore('DynamoDB')
  })

  it("should return a correct tweet message", async () => {
    AWSMock.mock('DynamoDB', 'query', (params: QueryInput, callback: Function) => {
      callback(null, {
        Items: [{
          url: {'S': 'https://www.youtube.com/channel/UCZ1xuCK1kNmn5RzPYIZop3w'},
          achievedDate: {'S': '2020-01-01T13:00:00Z'},
          count: {'N': 100000},
        }]
      });
    })
    AWSMock.mock('DynamoDB', 'putItem',
      (params: PutItemInput, callback: Function) => callback(null)
    )

    const dynamo = new DynamoDbClient(region, tableName)
    const channelId = '1M_sub'
    const watcher = new SubscriberWatcher(youtube, twitter, dynamo, subscriberCountFactor, channelId)

    const messages = await watcher.notify()
    expect(messages).toEqual([
      'リゼ様のYouTubeチャンネル登録者数が "1,000,000" 人に到達しました🎉'
    ])
  });

  it("should return nothing when milestone is not reached", async () => {
    AWSMock.mock('DynamoDB', 'query', (params: QueryInput, callback: Function) => {
      callback(null, {
        Items: [{
          url: {'S': 'https://www.youtube.com/channel/UCZ1xuCK1kNmn5RzPYIZop3w'},
          achievedDate: {'S': '2020-01-01T13:00:00Z'},
          count: {'N': 100000},
        }]
      });
    })
    AWSMock.mock('DynamoDB', 'putItem',
      (params: PutItemInput, callback: Function) => callback(null)
    )

    const dynamo = new DynamoDbClient(region, tableName)
    const channelId = '110k_sub'
    const watcher = new SubscriberWatcher(youtube, twitter, dynamo, subscriberCountFactor, channelId)

    const messages = await watcher.notify()
    expect(messages).toEqual([])
  });

  it("should return nothing when no milestone record is found", async () => {
    AWSMock.mock('DynamoDB', 'query',
      (params: QueryInput, callback: Function) => callback(null, {Items: []})
    )
    AWSMock.mock('DynamoDB', 'putItem',
      (params: PutItemInput, callback: Function) => callback(null)
    )

    const dynamo = new DynamoDbClient(region, tableName)
    const channelId = '1M_sub'
    const watcher = new SubscriberWatcher(youtube, twitter, dynamo, subscriberCountFactor, channelId)

    const messages = await watcher.notify()
    expect(messages).toEqual([])
  });
})
