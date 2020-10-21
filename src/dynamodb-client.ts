import AWS from "aws-sdk";

interface Milestone {
  url: string
  achievedDate: Date
  count: number
}

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
      KeyConditionExpression: `#urlKey = :urlValue`,
      ExpressionAttributeNames: {"#urlKey": 'url'},
      ExpressionAttributeValues: {":urlValue": {S: url}},
      ScanIndexForward: false,
      Limit: 1,
    })
    const response = await request.promise()
    const items = response.Items
    return items != undefined && items.length > 0
      ? parse(items[0])
      : undefined
  }

  async saveMilestone(milestone: Milestone): Promise<void> {
    const item = unparse(milestone)
    await this.dynamodb.putItem({
      TableName: this.tableName,
      Item: item,
    }).promise()
  }
}

function parse(item: AWS.DynamoDB.AttributeMap): Milestone {
  const i = AWS.DynamoDB.Converter.unmarshall(item)

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

function unparse(milestone: Milestone): AWS.DynamoDB.AttributeMap {
  const obj = {
    url: milestone.url,
    count: milestone.count,
    achievedDate: milestone.achievedDate.toISOString()
  }
  return AWS.DynamoDB.Converter.marshall(obj)
}