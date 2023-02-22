import { getAmplifyAppId } from '../..';
import * as getProjectMeta from '../../extensions/get-project-meta';

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
