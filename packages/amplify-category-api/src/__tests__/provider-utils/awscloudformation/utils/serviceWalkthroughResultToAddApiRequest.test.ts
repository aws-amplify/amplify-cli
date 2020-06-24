import { serviceWalkthroughResultToAddApiRequest } from '../../../../provider-utils/awscloudformation/utils/serviceWalkthroughResultToAddApiRequest';
import { AppSyncAuthType, ConflictResolution } from 'amplify-headless-interface/src';

jest.mock('../../../../provider-utils/awscloudformation/utils/authConfigToAppSyncAuthTypeBiDiMapper', () => ({
  authConfigToAppSyncAuthType: jest.fn((): AppSyncAuthType => ({ mode: 'AWS_IAM' })),
}));
jest.mock('../../../../provider-utils/awscloudformation/utils/resolverConfigToConflictResolutionBiDiMapper', () => ({
  resolverConfigToConflictResolution: jest.fn((): ConflictResolution => ({})),
}));

describe('walkthrough result to AddApiRequest conversion', () => {
  it('maps properties correctly', () => {
    const walkthroughResultStub = {
      answers: {
        apiName: 'myApiName',
      },
      schemaContent: 'mySchemaContent',
      output: {
        authConfig: {
          defaultAuthentication: 'defaultAuth',
          additionalAuthenticationProviders: ['otherAuth'],
        },
      },
    };
    const result = serviceWalkthroughResultToAddApiRequest(walkthroughResultStub);
    expect(result).toMatchSnapshot();
  });
});
