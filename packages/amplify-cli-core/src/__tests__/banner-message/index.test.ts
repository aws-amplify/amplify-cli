import nock from 'nock';
import url from 'url';
import { BannerMessage, AWS_AMPLIFY_DEFAULT_BANNER_URL, Message } from '../../banner-message';

const ONE_DAY = 1000 * 60 * 60 * 24;
let mockServer: nock.Interceptor;
let serverResponse: { version: string; messages: Message[] };
describe('BannerMessage', () => {
  beforeEach(async () => {
    serverResponse = {
      version: '1.0.0',
      messages: [
        {
          message: 'first message',
          id: 'first',
          conditions: {
            enabled: true,
            cliVersions: '4.41.0',
            startTime: new Date(Date.now() - ONE_DAY).toISOString(),
            endTime: new Date(Date.now() + ONE_DAY).toISOString(),
          },
        },
      ],
    };

    const urlInfo = url.parse(AWS_AMPLIFY_DEFAULT_BANNER_URL);
    mockServer = nock(`${urlInfo.protocol}//${urlInfo.host}`).get(urlInfo.pathname!);

    await BannerMessage.initialize('4.41.0');
  });
  afterEach(() => {
    BannerMessage.releaseInstance();
  });

  it('should return message by fetching it from remote url', async () => {
    mockServer.reply(200, serverResponse, { 'Content-Type': 'application/json' });
    const result = await BannerMessage.getMessage('first');
    expect(result).toEqual('first message');
  });

  it('should return message when there are no conditions', async () => {
    delete serverResponse.messages[0].conditions;
    mockServer.reply(200, serverResponse, { 'Content-Type': 'application/json' });
    const result = await BannerMessage.getMessage('first');
    expect(result).toEqual('first message');
  });

  it('should not throw error when server sends 404', async () => {
    mockServer.reply(404, 'page not found');
    const result = await BannerMessage.getMessage('first');
    expect(result).toBeUndefined();
  });

  it('Should not process the Banner response if the response version is not supported', async () => {
    serverResponse.version = '20.2';
    mockServer.reply(200, serverResponse, { 'Content-Type': 'application/json' });
    const result = await BannerMessage.getMessage('first');
    expect(result).toBeUndefined();
  });

  it('should not return message when the message version does not match', async () => {
    serverResponse.messages[0].conditions!.cliVersions! = '110022.0.0';
    mockServer.reply(200, serverResponse, { 'Content-Type': 'application/json' });
    const result = await BannerMessage.getMessage('first');
    expect(result).toBeUndefined();
  });

  it('should not show message when message is not enabled', async () => {
    serverResponse.messages[0].conditions!.enabled = false;
    mockServer.reply(200, serverResponse, { 'Content-Type': 'application/json' });
    const result = await BannerMessage.getMessage('first');
    expect(result).toBeUndefined();
  });

  it('should show message when conditions.enabled is undefined', async () => {
    (serverResponse.messages[0].conditions!.enabled as any) = undefined;
    mockServer.reply(200, serverResponse, { 'Content-Type': 'application/json' });
    const result = await BannerMessage.getMessage('first');
    expect(result).toEqual('first message');
  });

  it('should not show message when startDate is after current Date', async () => {
    serverResponse.messages[0].conditions!.endTime = undefined;
    serverResponse.messages[0].conditions!.startTime = new Date(Date.now() + ONE_DAY).toISOString();
    mockServer.reply(200, serverResponse, { 'Content-Type': 'application/json' });
    const result = await BannerMessage.getMessage('first');
    expect(result).toBeUndefined();
  });

  it('should not show message when endDate is before current Date', async () => {
    serverResponse.messages[0].conditions!.startTime = undefined;
    serverResponse.messages[0].conditions!.endTime = new Date(Date.now() - ONE_DAY).toISOString();
    mockServer.reply(200, serverResponse, { 'Content-Type': 'application/json' });
    const result = await BannerMessage.getMessage('first');
    expect(result).toBeUndefined();
  });

  it('should  show message when start and  endDate are not defined', async () => {
    delete serverResponse.messages[0].conditions!.startTime;
    delete serverResponse.messages[0]!.conditions!.endTime;
    mockServer.reply(200, serverResponse, { 'Content-Type': 'application/json' });
    const result = await BannerMessage.getMessage('first');
    expect(result).toEqual('first message');
  });

  it('should  show message when cliVersions is undefined', async () => {
    delete serverResponse.messages[0].conditions!.cliVersions;
    mockServer.reply(200, serverResponse, { 'Content-Type': 'application/json' });
    const result = await BannerMessage.getMessage('first');
    expect(result).toEqual('first message');
  });

  it('should throw error when BannerMessage is not initialized', async () => {
    BannerMessage.releaseInstance();
    await expect(() => BannerMessage.getMessage('first')).rejects.toThrowError('BannerMessage is not initialized');
  });
});
