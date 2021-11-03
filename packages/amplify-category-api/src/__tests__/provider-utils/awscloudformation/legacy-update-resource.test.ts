import { $TSContext } from 'amplify-cli-core';
import { legacyUpdateResource } from '../../../provider-utils/awscloudformation/legacy-update-resource';
import { category } from '../../../category-constants';

jest.mock('fs-extra');
jest.mock('amplify-cli-core', () => ({
  JSONUtilities: {
    readJson: jest.fn(),
    writeJson: jest.fn(),
  },
  pathManager: {
    getResourceDirectoryPath: jest.fn(_ => 'mock/backend/path'),
  },
}));

describe('legacy update resource', () => {
  const contextStub = {
    amplify: {
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
    await legacyUpdateResource(stubWalkthroughPromise, contextStub as unknown as $TSContext, category, 'API Gateway');
    expect(contextStub.amplify.copyBatch.mock.calls[0][2]).toMatchSnapshot();
  });
});
