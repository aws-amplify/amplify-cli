import { stateManager } from 'amplify-cli-core';
import { BuildType } from 'amplify-function-plugin-interface';
import { updateamplifyMetaAfterBuild } from '../../../extensions/amplify-helpers/update-amplify-meta';

jest.mock('amplify-cli-core');

const stateManager_mock = stateManager as jest.Mocked<typeof stateManager>;

stateManager_mock.getMeta.mockReturnValue({});

describe('update amplify meta after build', () => {
  it('writes dev build timestamp', () => {
    updateamplifyMetaAfterBuild({ category: 'testcategory', resourceName: 'testresource' }, BuildType.DEV);
    expect(stateManager_mock.setMeta.mock.calls[0][1].testcategory.testresource.lastDevBuildTimeStamp).toBeDefined();
  });

  it('defaults to prod build', () => {
    updateamplifyMetaAfterBuild({ category: 'testcategory', resourceName: 'testresource' });
    expect(stateManager_mock.setMeta.mock.calls[0][1].testcategory.testresource.lastBuildTimeStamp).toBeDefined();
  });
});
