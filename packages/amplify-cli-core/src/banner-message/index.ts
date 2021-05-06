import fetch from 'node-fetch';
import semver from 'semver';

export type Message = {
  message: string;
  id: string;
  conditions?: {
    enabled: boolean;
    cliVersions?: string;
    startTime?: string;
    endTime?: string;
  };
};

export const DEFAULT_BANNER_URL: string = 'https://aws-amplify.github.io/amplify-cli/banner-message.json';
const MAX_SUPPORTED_MESSAGE_CONFIG_VERSION = '1.0.0';
export class BannerMessage {
  private static instance?: BannerMessage;
  private messages: Message[] = [];

  public static initialize = (cliVersion: string): BannerMessage => {
    if (!BannerMessage.instance) {
      BannerMessage.instance = new BannerMessage(cliVersion);
    }

    return BannerMessage.instance;
  };

  private static ensureInitialized = () => {
    if (!BannerMessage.instance) {
      throw new Error('BannerMessage is not initialized');
    }
  };

  private constructor(private cliVersion: string) {}
  private fetchMessages = async (url: string): Promise<void> => {
    try {
      const result = await fetch(url);
      const body = await result.json();
      if (!semver.satisfies(body.version, MAX_SUPPORTED_MESSAGE_CONFIG_VERSION)) {
        return;
      }
      this.messages = body.messages ?? [];
    } catch {
      // network error should not cause CLI execution failure
    }
  };
  public static getMessage = async (messageId: string): Promise<string | undefined> => {
    BannerMessage.ensureInitialized();
    return BannerMessage.instance!.getMessages(messageId);
  };

  getMessages = async (messageId: string): Promise<string | undefined> => {
    if (!this.messages?.length) {
      await this.fetchMessages(process.env.BANNER_MESSAGE_URL ?? DEFAULT_BANNER_URL);
    }
    const allMatchingMessages = this.messages
      .filter(m => m.id === messageId)
      .filter(m => m.conditions?.enabled !== false)
      .filter(m => (m.conditions?.cliVersions ? semver.satisfies(this.cliVersion, m.conditions?.cliVersions) : true));
    const message = allMatchingMessages.find(m => {
      if (m.conditions) {
        const currentTime = Date.now();
        const startTime = m.conditions?.startTime ? Date.parse(m.conditions?.startTime) : currentTime;
        const endTime = m.conditions?.endTime ? Date.parse(m.conditions?.endTime) : currentTime;
        return currentTime >= startTime && currentTime <= endTime;
      }
      return true;
    });

    return message?.message;
  };

  /**
   * @internal
   * package private method used in unit tests to release the instance
   */
  public static releaseInstance = (): void => {
    BannerMessage.instance = undefined;
  };
}
