import { openConsole, isMockable } from '../../../provider-utils/awscloudformation';
import { ServiceName } from '../../../provider-utils/awscloudformation/utils/constants';
import open from 'open';

jest.mock('open');

describe('awscloudformation function provider', () => {
  it('opens the correct service console', () => {
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
    };
    openConsole(contextStub, ServiceName.LambdaFunction);
    const openMock = open as any;
    expect(openMock.mock.calls.length).toBe(1);
    expect(openMock.mock.calls[0][0]).toMatchSnapshot();

    openMock.mockClear();

    openConsole(contextStub, ServiceName.LambdaLayer);
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
});
