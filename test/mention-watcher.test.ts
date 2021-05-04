import {TwitterClientMock} from "./twitter-client.mock";
import {Context, DynamoDBStreamEvent} from "aws-lambda";
import {MentionWatcher} from "../src/mention-watcher";

const twitter = new TwitterClientMock()


describe('MentionWatcher.handler', () => {
  const event: DynamoDBStreamEvent = {
    Records: [{
      "eventID": "1",
      "eventName": "INSERT",
      "eventVersion": "1.0",
      "eventSource": "aws:dynamodb",
      "awsRegion": "us-east-1",
      "dynamodb": {
        "Keys": {
          "url": {
            "S": "https://www.youtube.com/watch?v=9r_1yLnqS-0"
          }
        },
        "NewImage": {
          "url": {
            "S": "https://www.youtube.com/watch?v=9r_1yLnqS-0"
          },
          "title": {
            "S": "【#にじ鯖夏祭り/マイクラ】さんばかと夏祭りいくよ～～！！！【アンジュ視点／リゼ・ヘルエスタ／戌亥とこ／にじさんじ】"
          },
          "channel_title": {
            "S": "アンジュ・カトリーナ - Ange Katrina -"
          },
          "channel_url": {
            "S": "https://www.youtube.com/channel/UCHVXbQzkl3rDfsXWo8xi2qw"
          },
          "description": {
            "S": "\"さんばかの皆で今日は夏祭り満喫します！\\n今年も夏祭り運営してくれる運営の皆様には超感謝！！\\n\\n【#さんばか】\\n\\nリゼ・ヘルエスタ👑@Lize_Helesta\\nhttps://www.youtube.com/channel/UCZ1xuCK1kNmn5RzPYIZop3w\\n\\n戌亥とこ🍹@inui_toko\\nhttps://www.youtube.com/channel/UCXRlIK3Cw_TJIQC5kSJJQM"
          }
        },
        "SequenceNumber": "111",
        "SizeBytes": 26,
        "StreamViewType": "NEW_AND_OLD_IMAGES"
      },
      "eventSourceARN": "stream-ARN"
    }]
  }
  const context = {} as Context

  it('should successfully run', async () => {
    const channelId = "UCZ1xuCK1kNmn5RzPYIZop3w"
    const channelTitle = "@リゼ・ヘルエスタ -Lize Helesta-"
    const handler = new MentionWatcher(twitter, channelId, channelTitle).handler
    await handler(event, context)
  })

  it('should successfully run', async () => {
    const channelId = "arbitrary channel ID"
    const channelTitle = "@リゼ・ヘルエスタ -Lize Helesta-"
    const handler = new MentionWatcher(twitter, channelId, channelTitle).handler
    await handler(event, context)
  })
})

describe('MentionWatcher.notificationMessages', () => {
  it('should return correct tweet messages', async () => {
    const videoTitle = 'video title'
    const videoUrl = 'https://www.youtube.com/watch?v=9r_1yLnqS-0'
    const channelId = 'channel_id'
    const channelTitle = "arbitrary_channel"

    const videos = [{
      url: videoUrl,
      title: videoTitle,
      channel_url: "https://www.youtube.com/channel/UCHVXbQzkl3rDfsXWo8xi2qw",
      channel_title: "channel title",
      description: `https://www.youtube.com/channel/${channelId}`,
    }]

    const messages = await new MentionWatcher(twitter, channelId, channelTitle).notificationMessages(videos)
    const expected = [
      `【出演情報】\n次の動画にリゼ様が出演予定です\n\n${videoTitle}\n${videoUrl}\n\n#リゼ・ヘルエスタ`
    ]

    expect(messages).toEqual(expected)
  })

  it('should return correct tweet messages', async () => {
    const videoTitle = 'video title'
    const videoUrl = 'https://www.youtube.com/watch?v=9r_1yLnqS-0'
    const channelId = 'channel_id'
    const channelTitle = "channel"

    const videos = [{
      url: videoUrl,
      title: videoTitle,
      channel_url: "https://www.youtube.com/channel/UCHVXbQzkl3rDfsXWo8xi2qw",
      channel_title: "channel title",
      description: `foo bar @channel`,
    }]

    const messages = await new MentionWatcher(twitter, channelId, channelTitle).notificationMessages(videos)
    const expected = [
      `【出演情報】\n次の動画にリゼ様が出演予定です\n\n${videoTitle}\n${videoUrl}\n\n#リゼ・ヘルエスタ`
    ]

    expect(messages).toEqual(expected)
  })

  it('should return an empty array when a given video does not mention a given channel', async () => {
    const videoTitle = 'video title'
    const videoUrl = 'https://www.youtube.com/watch?v=9r_1yLnqS-0'
    const channelId = 'channel_id'
    const channelTitle = "arbitrary_channel"

    const videos = [{
      url: videoUrl,
      title: videoTitle,
      channel_url: "https://www.youtube.com/channel/UCHVXbQzkl3rDfsXWo8xi2qw",
      channel_title: "channel title",
      description: "arbitrary description",
    }]

    const messages = await new MentionWatcher(twitter, channelId, channelTitle).notificationMessages(videos)
    const expected: string[] = []

    expect(messages).toEqual(expected)
  })

  it('should return an empty array when a given video is posted on the specified channel', async () => {
    const videoTitle = 'video title'
    const videoUrl = 'https://www.youtube.com/watch?v=9r_1yLnqS-0'
    const channelId = 'channel_id'
    const channelTitle = "arbitrary_channel"

    const videos = [{
      url: videoUrl,
      title: videoTitle,
      channel_url: `https://www.youtube.com/channel/${channelId}`,
      channel_title: "channel title",
      description: `https://www.youtube.com/channel/${channelId}`,
    }]

    const messages = await new MentionWatcher(twitter, channelId, channelTitle).notificationMessages(videos)
    const expected: string[] = []

    expect(messages).toEqual(expected)
  })
})
