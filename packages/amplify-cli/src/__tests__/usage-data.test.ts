import nock from 'nock';
import url from 'url';
import * as uuid from 'uuid';

import { AmplifyError, ManuallyTimedCodePath } from '@aws-amplify/amplify-cli-core';
import { ProjectSettings } from '@aws-amplify/amplify-cli-core/src/types';
import { printer } from '@aws-amplify/amplify-prompts';
import { SerializableError } from '../domain/amplify-usageData/SerializableError';
import { UsageData } from '../domain/amplify-usageData/UsageData';
import { UsageDataPayload } from '../domain/amplify-usageData/UsageDataPayload';
import { getUrl } from '../domain/amplify-usageData/getUsageDataUrl';
import { CLIInput as CommandLineInput } from '../domain/command-input';

const baseOriginalUrl = 'https://cli.amplify';
const pathToUrl = '/metrics';
const originalUrl = `${baseOriginalUrl}${pathToUrl}`;

jest.mock('@aws-amplify/amplify-prompts');

describe('test usageData', () => {
  const printerMock = printer as jest.Mocked<typeof printer>;

  beforeEach(() => {
    printerMock.debug = jest.fn();
  });

  beforeAll(() => {
    process.env = Object.assign(process.env, { AMPLIFY_CLI_BETA_USAGE_TRACKING_URL: originalUrl });
  });
  afterAll(() => {
    nock.cleanAll();
    delete process.env.AMPLIFY_CLI_BETA_USAGE_TRACKING_URL;
  });

  const scope = nock(baseOriginalUrl, {
    reqheaders: {
      'content-type': 'application/json',
    },
  }).persist();

  it('test getUrl', () => {
    const testUrl = getUrl();
    const parseOriginalUrl = url.parse(originalUrl);
    expect(testUrl).toEqual(parseOriginalUrl);
  });

  it('test instance', () => {
    const a = UsageData.Instance;
    const b = UsageData.Instance;
    const timeStamp = Date.now();
    a.init(
      uuid.v4(),
      '',
      new CommandLineInput([]),
      'accountId',
      { editor: 'vscode', framework: 'react', frontend: 'javascript' } as unknown as ProjectSettings,
      timeStamp,
    );
    b.init(
      uuid.v4(),
      '',
      new CommandLineInput([]),
      'accountId',
      { editor: 'vscode', framework: 'react', frontend: 'javascript' } as unknown as ProjectSettings,
      timeStamp,
    );
    expect(a).toEqual(b);
  });

  it('records specified code path timer', async () => {
    const usageData = UsageData.Instance;
    usageData.startCodePathTimer(ManuallyTimedCodePath.PLUGIN_TIME);
    await new Promise((resolve) => setTimeout(resolve, 10));
    usageData.stopCodePathTimer(ManuallyTimedCodePath.PLUGIN_TIME);
    scope.post(pathToUrl, () => true).reply(200, '1234567890'.repeat(14));

    const result = (await (usageData as any).emit(null, 'SUCCEEDED')) as UsageDataPayload;
    expect(result.codePathDurations.pluginTime).toBeDefined();
  });

  it('test update stack event modification', () => {
    /* eslint-disable spellcheck/spell-checker */

    const events = [
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA/1cb34450-dae1-11ec-903e-0e3cee95ccd9',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA/1cb34450-dae1-11ec-903e-0e3cee95ccd9',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA/1cb34450-dae1-11ec-903e-0e3cee95ccd9',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA/1cb34450-dae1-11ec-903e-0e3cee95ccd9',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA-Todo-18AZMC2HP0N83/4fe5a6b0-dae1-11ec-ab72-0e1658febb4d',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA/1cb34450-dae1-11ec-903e-0e3cee95ccd9',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA-CustomResourcesjson-1XNIY9ZVM7FS2/811f1f40-dae1-11ec-8183-0e2f1a71649d',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA/1cb34450-dae1-11ec-903e-0e3cee95ccd9',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA-Todo-18AZMC2HP0N83/4fe5a6b0-dae1-11ec-ab72-0e1658febb4d',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA/1cb34450-dae1-11ec-903e-0e3cee95ccd9',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA-CustomResourcesjson-1XNIY9ZVM7FS2/811f1f40-dae1-11ec-8183-0e2f1a71649d',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA/1cb34450-dae1-11ec-903e-0e3cee95ccd9',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA/1cb34450-dae1-11ec-903e-0e3cee95ccd9',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA/1cb34450-dae1-11ec-903e-0e3cee95ccd9',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-functioncfnupdatestackece40aa4-4ENG44WXAUB9/55f48360-dae0-11ec-976f-12a4a24bb93d',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-functioncfnupdatestackece40aa4-4ENG44WXAUB9/55f48360-dae0-11ec-976f-12a4a24bb93d',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-functioncfnupdatestackece40aa4-4ENG44WXAUB9/55f48360-dae0-11ec-976f-12a4a24bb93d',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605-apicfnupdatestack-CFN5Z5P4EPIA/1cb34450-dae1-11ec-903e-0e3cee95ccd9',
      },
      {
        StackId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
        PhysicalResourceId:
          'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
      },
    ];
    UsageData.Instance.calculatePushNormalizationFactor(
      events,
      'arn:aws:cloudformation:us-east-1:1231212312123:stack/amplify-cfnupdatestack-dev-211605/8f3203d0-dadd-11ec-8998-0a4143e12911',
    );
    /* eslint-enable spellcheck/spell-checker */

    expect((UsageData.Instance as unknown as any).pushNormalizationFactor).toEqual(3);
  });

  it('should not error if starting a duplicate timer', () => {
    const usageData = UsageData.Instance;
    usageData.startCodePathTimer(ManuallyTimedCodePath.INIT_ENV_CATEGORIES);
    expect(() => usageData.startCodePathTimer(ManuallyTimedCodePath.INIT_ENV_CATEGORIES)).not.toThrowError();
    expect(printerMock.debug).toBeCalledWith(`${ManuallyTimedCodePath.INIT_ENV_CATEGORIES} already has a running timer`);
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

describe('test usage data payload generation', () => {
  it('when no error', async () => {
    expect(UsageData.Instance.getUsageDataPayload(null, '').error).toBeUndefined();
    expect(UsageData.Instance.getUsageDataPayload(null, '').downstreamException).toBeUndefined();
  });
  it('when error without downstream exception', async () => {
    const amplifyError = new AmplifyError('NotImplementedError', { message: 'test error message' });
    const usageData = UsageData.Instance.getUsageDataPayload(amplifyError, '');
    expect(usageData.error).toEqual(new SerializableError(amplifyError));
    expect(usageData.downstreamException).toBeUndefined();
  });
  it('when error with downstream exception', async () => {
    const downstreamException = new Error('DownStreamException');
    const amplifyError = new AmplifyError('NotImplementedError', { message: 'test error message' }, downstreamException);
    const usageData = UsageData.Instance.getUsageDataPayload(amplifyError, '');
    expect(usageData.error).toEqual(new SerializableError(amplifyError));
    expect(usageData.downstreamException).toEqual(new SerializableError(downstreamException));
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
