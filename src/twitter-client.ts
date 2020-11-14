import Twitter from 'twitter'

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
      consumer_key: apiKey,
      consumer_secret: apiSecret,
      access_token_key: accessToken,
      access_token_secret: accessTokenSecret,
    })
  }

  async tweet(message: string): Promise<void> {
    await this.twitter.post("statuses/update", {
      status: message
    })
  }
}