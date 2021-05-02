import {TwitterClientInterface} from "../src/twitter-client";

export class TwitterClientMock implements TwitterClientInterface {
  async tweet(message: string): Promise<void> {
    console.log(`Following message has been tweeted: "${message}"`)
  }
}
