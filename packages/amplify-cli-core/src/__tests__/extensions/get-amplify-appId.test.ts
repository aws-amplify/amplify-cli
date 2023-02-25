import { toolkitExtensions } from '../..';
import * as getProjectMeta from '../../toolkit-extensions/get-project-meta';

const { getAmplifyAppId } = toolkitExtensions;
jest.spyOn(getProjectMeta, 'getProjectMeta').mockReturnValue({
  providers: {
    awscloudformation: {
      AmplifyAppId: 'testAmplifyAppId',
    },
  },
});
describe('getAmplifyAppId', () => {
  it('should return the AmplifyAppId from the meta data.', () => {
    const appId = getAmplifyAppId();
    expect(appId).toEqual('testAmplifyAppId');
  });
});
