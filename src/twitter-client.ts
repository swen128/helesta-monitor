import Twitter from 'twitter-api-client'

export interface TwitterClientInterface {
  tweet(message: string): Promise<void>
}

export class TwitterClient implements TwitterClientInterface {
  private readonly twitter: Twitter

  constructor(
    private readonly apiKey: string,
    private readonly apiSecret: string,
    private readonly accessToken: string,
    private readonly accessTokenSecret: string,
  ) {
    this.twitter = new Twitter({
      apiKey, apiSecret, accessToken, accessTokenSecret
    })
  }

  async tweet(message: string): Promise<void> {
    await this.twitter.tweets.statusesUpdate({
      status: message
    })
  }
}