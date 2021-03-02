import { serviceWalkthroughResultToAddApiRequest } from '../../../../provider-utils/awscloudformation/utils/service-walkthrough-result-to-add-api-request';
import { AppSyncAuthType, ConflictResolution } from 'amplify-headless-interface';

jest.mock('../../../../provider-utils/awscloudformation/utils/auth-config-to-app-sync-auth-type-bi-di-mapper', () => ({
  authConfigToAppSyncAuthType: jest.fn((): AppSyncAuthType => ({ mode: 'AWS_IAM' })),
}));
jest.mock('../../../../provider-utils/awscloudformation/utils/resolver-config-to-conflict-resolution-bi-di-mapper', () => ({
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
