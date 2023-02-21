import { getAmplifyAppId } from 'amplify-cli-core/lib/extensions/get-amplify-appId';

jest.mock('amplify-cli-core/lib/extensions/get-project-meta', () => ({
  getProjectMeta: jest.fn().mockImplementation(() => ({
    providers: {
      awscloudformation: {
        AmplifyAppId: 'testAmplifyAppId',
      },
    },
  })),
}));

describe('getAmplifyAppId', () => {
  it('should return the AmplifyAppId from the meta data.', () => {
    const appId = getAmplifyAppId();
    expect(appId).toEqual('testAmplifyAppId');
  });
});
