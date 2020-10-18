import * as AWS from "aws-sdk";
import {Marshaller} from "@aws/dynamodb-auto-marshaller";

interface Milestone {
  url: string
  achievedDate: Date
  count: number
}

const marshaller = new Marshaller()

export class DynamoDbClient {
  readonly dynamodb: AWS.DynamoDB

  constructor(
    private readonly region: string,
    private readonly tableName: string,
  ) {
    AWS.config.update({region: region})
    this.dynamodb = new AWS.DynamoDB()
  }

  async getLastMilestone(url: string): Promise<Milestone | undefined> {
    const request = this.dynamodb.query({
      TableName: this.tableName,
      KeyConditionExpression: `url = ${url}`,
      ScanIndexForward: true,
      Limit: 1,
    })
    const response = await request.promise()
    return response.Count > 0
      ? parse(response.Items[0])
      : undefined
  }

  async saveMilestone(milestone: Milestone): Promise<void> {
    await this.dynamodb.putItem({
      TableName: this.tableName,
      Item: unparse(milestone),
    }).promise()
  }
}

function parse(item: AWS.DynamoDB.AttributeMap): Milestone {
  try {
    const i = marshaller.unmarshallItem(item) as any
    return {
      url: i.url,
      achievedDate: new Date(Date.parse(i.achievedDate)),
      count: i.count,
    }
  } catch (e) {
    throw new Error(`Could not convert the given object to Milestone type: ${item}`)
  }
}

function unparse(milestone: Milestone): AWS.DynamoDB.AttributeMap {
  return marshaller.marshallItem(milestone)
}