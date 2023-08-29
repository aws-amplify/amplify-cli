import { openConsole, isMockable } from '../../../provider-utils/awscloudformation';
import { ServiceName } from '../../../provider-utils/awscloudformation/utils/constants';
import { open, $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import { buildFunction } from '../../../provider-utils/awscloudformation/utils/buildFunction';
import { getBuilder } from '../../..';
import { BuildType } from '@aws-amplify/amplify-function-plugin-interface';

jest.mock('@aws-amplify/amplify-cli-core');
const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;
stateManager_mock.getMeta.mockReturnValue({
  providers: {
    awscloudformation: {
      Region: 'myMockRegion',
    },
  },
  function: {
    testFunc: {
      lastBuildTimeStamp: 'lastBuildTimeStamp',
      lastDevBuildTimeStamp: 'lastDevBuildTimeStamp',
    },
  },
});
jest.mock('open');

jest.mock('../../../provider-utils/awscloudformation/utils/buildFunction', () => ({
  buildFunction: jest.fn(),
  buildTypeKeyMap: {
    PROD: 'lastBuildTimeStamp',
    DEV: 'lastDevBuildTimeStamp',
  },
}));
const buildFunction_mock = buildFunction as jest.MockedFunction<typeof buildFunction>;

describe('awscloudformation function provider', () => {
  beforeEach(() => jest.clearAllMocks());
  it('opens the correct service console', async () => {
    const contextStub = {
      amplify: {
        getProjectMeta: () => ({
          providers: {
            awscloudformation: {
              Region: 'myMockRegion',
            },
          },
        }),
      },
    } as $TSContext;
    await openConsole(contextStub, ServiceName.LambdaFunction);
    const openMock = open as any;
    expect(openMock.mock.calls.length).toBe(1);
    expect(openMock.mock.calls[0][0]).toMatchSnapshot();

    openMock.mockClear();

    await openConsole(contextStub, ServiceName.LambdaLayer);
    expect(openMock.mock.calls.length).toBe(1);
    expect(openMock.mock.calls[0][0]).toMatchSnapshot();
  });

  it('cannot mock lambda layers', () => {
    const isLayerMockable = isMockable(ServiceName.LambdaLayer);
    expect(isLayerMockable.isMockable).toBe(false);
  });

  it('can mock lambda functions', () => {
    const isFunctionMockable = isMockable(ServiceName.LambdaFunction);
    expect(isFunctionMockable.isMockable).toBe(true);
  });

  it('passes correct build timestamp to buildFunction', async () => {
    const prodBuilder = await getBuilder({} as $TSContext, 'testFunc', BuildType.PROD);
    await prodBuilder();
    expect(buildFunction_mock.mock.calls[0][1].lastBuildTimestamp).toEqual('lastBuildTimeStamp');

    buildFunction_mock.mockClear();

    const devBuilder = await getBuilder({} as $TSContext, 'testFunc', BuildType.DEV);
    await devBuilder();
    expect(buildFunction_mock.mock.calls[0][1].lastBuildTimestamp).toEqual('lastDevBuildTimeStamp');
  });
});
