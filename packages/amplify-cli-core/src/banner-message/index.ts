import fetch from 'node-fetch';
import semver from 'semver';
import { ProxyAgent } from 'proxy-agent';
import { getLogger } from '../logger';

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

export const AWS_AMPLIFY_DEFAULT_BANNER_URL = 'https://aws-amplify.github.io/amplify-cli/banner-message.json';
const MAX_SUPPORTED_MESSAGE_CONFIG_VERSION = '1.0.0';

const logger = getLogger('@aws-amplify/amplify-cli-core', 'banner-message/index.ts');

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
      logger.info(`fetch banner messages from ${url}`);
      const proxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
      // HTTP_PROXY & HTTPS_PROXY env vars are read automatically by ProxyAgent, but we check to see if they are set before using the proxy
      const fetchOptions = proxy ? { agent: new ProxyAgent() } : {};
      const result = await fetch(url, fetchOptions);
      const body = await result.json();
      if (!semver.satisfies(body.version, MAX_SUPPORTED_MESSAGE_CONFIG_VERSION)) {
        return;
      }
      this.messages = body.messages ?? [];
    } catch (e) {
      // network error should not cause CLI execution failure
      logger.error('fetch banner message failed', e);
    }
  };

  public static getMessage = async (messageId: string): Promise<string | undefined> => {
    BannerMessage.ensureInitialized();
    return BannerMessage.instance!.getMessages(messageId);
  };

  getMessages = async (messageId: string): Promise<string | undefined> => {
    if (!this.messages.length) {
      await this.fetchMessages(process.env.AMPLIFY_CLI_BANNER_MESSAGE_URL ?? AWS_AMPLIFY_DEFAULT_BANNER_URL);
    }

    const matchingMessageItems = this.messages.filter(
      (m) =>
        m.id === messageId &&
        m.conditions?.enabled !== false &&
        (m.conditions?.cliVersions ? semver.satisfies(this.cliVersion, m.conditions.cliVersions) : true),
    );

    const messageItem = matchingMessageItems.find((m) => {
      if (m.conditions) {
        const currentTime = Date.now();
        const startTime = m.conditions?.startTime ? Date.parse(m.conditions?.startTime) : currentTime;
        const endTime = m.conditions?.endTime ? Date.parse(m.conditions?.endTime) : currentTime;
        return currentTime >= startTime && currentTime <= endTime;
      }
      return true;
    });

    return messageItem?.message;
  };

  /**
   * @internal
   * package private method used in unit tests to release the instance
   */
  public static releaseInstance = (): void => {
    BannerMessage.instance = undefined;
  };
}
