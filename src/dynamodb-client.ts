import {DynamoDBClient, QueryCommand, PutItemCommand, AttributeValue} from "@aws-sdk/client-dynamodb";
import {marshall, unmarshall} from "@aws-sdk/util-dynamodb";
import {MilestoneService, Milestone} from "./milestone-service"

type AttributeMap = Record<string, AttributeValue>

export class DynamoDbClient implements MilestoneService {
  readonly dynamodb: DynamoDBClient

  constructor(
    private readonly region: string,
    private readonly tableName: string,
  ) {
    this.dynamodb = new DynamoDBClient({region})
  }

  async getLastMilestone(url: string): Promise<Milestone | undefined> {
    const request = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: `#urlKey = :urlValue`,
      ExpressionAttributeNames: {"#urlKey": 'url'},
      ExpressionAttributeValues: {":urlValue": {S: url}},
      ScanIndexForward: false,
      Limit: 1,
    })
    const response = await this.dynamodb.send(request)
    const items = response.Items
    return items != undefined && items.length > 0
      ? parse(items[0])
      : undefined
  }

  async saveMilestone(milestone: Milestone): Promise<void> {
    const item = unparse(milestone)
    const request = new PutItemCommand({
      TableName: this.tableName,
      Item: item,
    })
    await this.dynamodb.send(request)
  }
}

function parse(item: AttributeMap): Milestone {
  const i = unmarshall(item)

  if (
    typeof i.url !== 'string' ||
    typeof i.achievedDate !== 'string' ||
    typeof i.count !== 'number'
  ) {
    throw new Error(`Could not convert the given object to Milestone type: ${JSON.stringify(i)}`)
  }

  return {
    url: i.url,
    achievedDate: new Date(Date.parse(i.achievedDate)),
    count: i.count,
  }
}

function unparse(milestone: Milestone): AttributeMap {
  const obj = {
    url: milestone.url,
    count: milestone.count,
    achievedDate: milestone.achievedDate.toISOString()
  }
  return marshall(obj)
}