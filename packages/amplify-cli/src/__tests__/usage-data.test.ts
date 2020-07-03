import url from 'url';
import nock from 'nock';
import uuid from 'uuid';

import { UsageData } from '../domain/amplify-usageData/UsageData';
import { getUrl } from '../domain/amplify-usageData/getUsageDataUrl';
import { Input } from '../domain/input';

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
    const parseOrginalUrl = url.parse(originalUrl);
    expect(testUrl).toEqual(parseOrginalUrl);
  });

  it('test instance', () => {
    const a = UsageData.Instance;
    const b = UsageData.Instance;
    a.init(uuid.v4(), '', new Input([]));
    b.init(uuid.v4(), '', new Input([]));
    expect(a).toEqual(b);
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

  it('test https with 200 long randomstring', async () => {
    scope.post(pathToUrl, () => true).reply(200, '1234567890'.repeat(14));
    await checkUsageData();
  });

  it('test delay', async () => {
    scope.post(pathToUrl, () => true).delay(10000);
    await checkUsageData();
  });
});

async function checkUsageData() {
  const abortResponse = await UsageData.Instance.emitAbort();
  expect(abortResponse).toBeUndefined();
  const errorResponse = await UsageData.Instance.emitError(new Error('something went wrong'));
  expect(errorResponse).toBeUndefined();

  const successResponse = await UsageData.Instance.emitSuccess();
  expect(successResponse).toBeUndefined();
  const invokeResponse = await UsageData.Instance.emitInvoke();
  expect(invokeResponse).toBeUndefined();
}
