import AWSMock from "aws-sdk-mock";
import AWS from "aws-sdk";
import {Context, ScheduledEvent} from "aws-lambda";
import {PutItemInput, QueryInput} from "aws-sdk/clients/dynamodb";

import {DynamoDbClient} from "../src/dynamodb-client";
import {PlaylistWatcher} from "../src/playlist-watcher";
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

const viewCountFactor = 100000
const playlistId = 'placeholder'

describe("PlaylistWatcher.handler", () => {
  beforeEach(() => {
    AWSMock.setSDKInstance(AWS);
  })

  afterEach(() => {
    AWSMock.restore('DynamoDB')
  })

  it("should succeed", async () => {
    AWSMock.mock('DynamoDB', 'query', (params: QueryInput, callback: Function) => {
      expect(params.ScanIndexForward).toBeFalsy()
      
      callback(null, {
        Items: [{
          url: {'S': 'https://youtu.be/videoId'},
          achievedDate: {'S': '2020-01-01T13:00:00Z'},
          count: {'N': 100000},
        }]
      });
    })
    AWSMock.mock('DynamoDB', 'putItem', (params: PutItemInput, callback: Function) => {
      expect(params.TableName).toEqual(tableName)
      callback(null);
    })

    const dynamo = new DynamoDbClient(region, tableName)
    const handler = new PlaylistWatcher(youtube, twitter, dynamo, viewCountFactor, playlistId).handler

    await handler(event, context)
  });
});

describe("PlaylistWatcher.notify", () => {
  beforeEach(() => {
    AWSMock.setSDKInstance(AWS);
  })

  afterEach(() => {
    AWSMock.restore('DynamoDB')
  })

  it("should return correct tweet messages", async () => {
    AWSMock.mock('DynamoDB', 'query', (params: QueryInput, callback: Function) => {
      callback(null, {
        Items: [{
          url: {'S': 'https://youtu.be/videoId'},
          achievedDate: {'S': '2020-01-01T13:00:00Z'},
          count: {'N': 100000},
        }]
      });
    })
    AWSMock.mock('DynamoDB', 'putItem',
      (params: PutItemInput, callback: Function) => callback(null)
    )

    const dynamo = new DynamoDbClient(region, tableName)
    const watcher = new PlaylistWatcher(youtube, twitter, dynamo, viewCountFactor, playlistId)

    const messages = await watcher.notify()
    expect(messages).toEqual([
      '【再生数記念】\nリゼ様の動画再生数が 100 万回に到達しました🎉\n\nvideo with 1M views\nhttps://youtu.be/2\n\n#リゼ・ヘルエスタ'
    ])
  });

  it("should return nothing when no milestone record is found", async () => {
    AWSMock.mock('DynamoDB', 'query',
      (params: QueryInput, callback: Function) => callback(null, {Items: []})
    )
    AWSMock.mock('DynamoDB', 'putItem',
      (params: PutItemInput, callback: Function) => callback(null)
    )

    const dynamo = new DynamoDbClient(region, tableName)
    const watcher = new PlaylistWatcher(youtube, twitter, dynamo, viewCountFactor, playlistId)

    const messages = await watcher.notify()
    expect(messages).toEqual([])
  });
})
