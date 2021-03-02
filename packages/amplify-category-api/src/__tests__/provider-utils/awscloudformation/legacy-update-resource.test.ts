import { legacyUpdateResource } from '../../../provider-utils/awscloudformation/legacy-update-resource';
import { category } from '../../../category-constants';

jest.mock('fs-extra');

describe('legacy update resource', () => {
  const contextStub = {
    amplify: {
      pathManager: {
        getBackendDirPath: jest.fn(_ => 'mock/backend/path'),
      },
      updateamplifyMetaAfterResourceUpdate: jest.fn(),
      copyBatch: jest.fn(),
    },
  };

  it('sets policy resource name in paths object before copying template', async () => {
    const stubWalkthroughPromise: Promise<any> = Promise.resolve({
      answers: {
        resourceName: 'mockResourceName',
        paths: [
          {
            name: '/some/{path}/with/{params}',
          },
          {
            name: 'another/path/without/params',
          },
        ],
      },
    });
    await legacyUpdateResource(stubWalkthroughPromise, contextStub, category, 'API Gateway');
    expect(contextStub.amplify.copyBatch.mock.calls[0][2]).toMatchSnapshot();
  });
});
