import {TwitterClientInterface} from "../src/twitter-client";

export class TwitterClientMock implements TwitterClientInterface {
  async tweet(message: string): Promise<void> {
    console.log(`Following message has been tweeted: "${message}"`)
  }
}

export class ErroneousTwitterClientMock implements TwitterClientInterface {
  async tweet(message: string): Promise<void> {
    throw new Error('HTTP Error: 403 Forbidden')
  }
}
