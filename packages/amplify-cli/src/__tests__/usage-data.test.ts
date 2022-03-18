import url from 'url';
import nock from 'nock';
import * as uuid from 'uuid';

import { UsageData } from '../domain/amplify-usageData/UsageData';
import { getUrl } from '../domain/amplify-usageData/getUsageDataUrl';
import { Input } from '../domain/input';
import { ManuallyTimedCodePath } from '../domain/amplify-usageData/IUsageData';
import { UsageDataPayload } from '../domain/amplify-usageData/UsageDataPayload';

const baseOriginalUrl = 'https://cli.amplify';
const pathToUrl = '/metrics';
const originalUrl = `${baseOriginalUrl}${pathToUrl}`;

describe('test usageData', () => {
  beforeAll(() => {
    process.env = Object.assign(process.env, { AMPLIFY_CLI_BETA_USAGE_TRACKING_URL: originalUrl });
  });
  afterAll(() => {
    nock.cleanAll();
    delete process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL;
  });

  it('test getUrl', () => {
    const testUrl = getUrl();
    const parseOriginalUrl = url.parse(originalUrl);
    expect(testUrl).toEqual(parseOriginalUrl);
  });

  it('test instance', () => {
    const a = UsageData.Instance;
    const b = UsageData.Instance;
    const timeStamp = Date.now();
    a.init(uuid.v4(), '', new Input([]), 'accountId', { editor: 'vscode', framework: 'react', frontend: 'javascript' }, timeStamp);
    b.init(uuid.v4(), '', new Input([]), 'accountId', { editor: 'vscode', framework: 'react', frontend: 'javascript' }, timeStamp);
    expect(a).toEqual(b);
  });

  it('records specified code path timer', async () => {
    const usageData = UsageData.Instance;
    usageData.startCodePathTimer(ManuallyTimedCodePath.PLUGIN_TIME);
    await new Promise(resolve => setTimeout(resolve, 10));
    usageData.stopCodePathTimer(ManuallyTimedCodePath.PLUGIN_TIME);
    const result = (usageData as any).emit(null, 'SUCCEEDED') as UsageDataPayload;
    expect(result.codePathDurations.pluginTime).toBeDefined();
  });

  it('errors if starting a duplicate timer', () => {
    const usageData = UsageData.Instance;
    usageData.startCodePathTimer(ManuallyTimedCodePath.INIT_ENV_CATEGORIES);
    expect(() => usageData.startCodePathTimer(ManuallyTimedCodePath.INIT_ENV_CATEGORIES)).toThrowErrorMatchingInlineSnapshot();
  });

  it('does nothing when stopping a timer that is not running', () => {
    const usageData = UsageData.Instance;
    expect(() => usageData.stopCodePathTimer(ManuallyTimedCodePath.PUSH_DEPLOYMENT)).not.toThrow();
  });
});

describe('test usageData calls', () => {
  beforeAll(() => {
    process.env = Object.assign(process.env, { AMPLIFY_CLI_BETA_USAGE_TRACKING_URL: originalUrl });
  });
  afterAll(() => {
    nock.cleanAll();
    jest.clearAllMocks();
    delete process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL;
  });
  const scope = nock(baseOriginalUrl, {
    reqheaders: {
      'content-type': 'application/json',
    },
  }).persist();

  it('test https with 503', async () => {
    scope.post(pathToUrl, () => true).reply(503, 'Service Unavailable');
    await checkUsageData();
  });

  it('test https with 400', async () => {
    scope.post(pathToUrl, () => true).reply(400, 'Bad Request');
    await checkUsageData();
  });

  it('test https with 302 redirect', async () => {
    scope
      .post(pathToUrl, () => true)
      .reply(302, undefined, {
        Location: 'https://somewhere/metrics',
      })
      .post('/metrics')
      .reply(400, 'Bad Request');
    await checkUsageData();
  });

  it('test https with 200 long random string', async () => {
    scope.post(pathToUrl, () => true).reply(200, '1234567890'.repeat(14));
    await checkUsageData();
  });

  it('test delay', async () => {
    scope.post(pathToUrl, () => true).delay(10000);
    await checkUsageData();
  });
});

const checkUsageData = async (): Promise<void> => {
  const abortResponse = await UsageData.Instance.emitAbort();
  expect(abortResponse).toBeUndefined();
  const errorResponse = await UsageData.Instance.emitError(new Error('something went wrong'));
  expect(errorResponse).toBeUndefined();

  const successResponse = await UsageData.Instance.emitSuccess();
  expect(successResponse).toBeUndefined();
};
