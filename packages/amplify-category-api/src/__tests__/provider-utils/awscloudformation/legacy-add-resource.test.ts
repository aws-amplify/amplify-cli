import { legacyAddResource } from '../../../provider-utils/awscloudformation/legacy-add-resource';
import { category } from '../../../category-constants';
import { $TSAny, $TSContext } from 'amplify-cli-core';

jest.mock('fs-extra');
jest.mock('amplify-cli-core', () => ({
  isResourceNameUnique: jest.fn().mockReturnValue(true),
  JSONUtilities: {
    readJson: jest.fn(),
    writeJson: jest.fn(),
  },
  pathManager: {
    getResourceDirectoryPath: jest.fn(_ => 'mock/backend/path'),
  },
}));

describe('legacy add resource', () => {
  const contextStub = {
    amplify: {
      updateamplifyMetaAfterResourceAdd: jest.fn(),
      copyBatch: jest.fn(),
    },
  };

  it('sets policy resource name in paths object before copying template', async () => {
    const stubWalkthroughPromise: Promise<$TSAny> = Promise.resolve({
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
    await legacyAddResource(stubWalkthroughPromise, contextStub as unknown as $TSContext, category, 'API Gateway', {});
    expect(contextStub.amplify.copyBatch.mock.calls[0][2]).toMatchSnapshot();
  });
});
