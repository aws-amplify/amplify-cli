import { getAmplifyAppId } from '../../../extensions/amplify-helpers/get-amplify-appId';

jest.mock('../../../extensions/amplify-helpers/get-project-meta.ts', () => ({
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
