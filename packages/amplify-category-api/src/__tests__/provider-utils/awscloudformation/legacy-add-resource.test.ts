import { legacyAddResource } from '../../../provider-utils/awscloudformation/legacy-add-resource';
import { category } from '../../../category-constants';

jest.mock('fs-extra');

describe('legacy add resource', () => {
  const contextStub = {
    amplify: {
      pathManager: {
        getBackendDirPath: jest.fn(_ => 'mock/backend/path'),
      },
      updateamplifyMetaAfterResourceAdd: jest.fn(),
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
    await legacyAddResource(stubWalkthroughPromise, contextStub, category, 'API Gateway', {});
    expect(contextStub.amplify.copyBatch.mock.calls[0][2]).toMatchSnapshot();
  });
});
