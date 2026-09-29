import { getImportedAuthProperties } from '../../../extensions/amplify-helpers/get-imported-auth-properties';

describe('get-imported-auth-properties', () => {
  let context;

  beforeAll(() => {
    context = {
      amplify: {
        getProjectDetails: jest.fn(),
        loadEnvResourceParameters: jest.fn(),
      },
    };
  });

  it('returns imported auth properties when UserPool and IdentityPool imported', () => {
    context.amplify.getProjectDetails.mockReturnValue({
      amplifyMeta: {
        auth: {
          authResourceName: {
            service: 'Cognito',
            serviceType: 'imported',
            providerPlugin: 'awscloudformation',
          },
        },
      },
    });

    context.amplify.loadEnvResourceParameters.mockReturnValue({
      userPoolId: 'us-east-1_ABCDEFGHI',
      userPoolName: 'cognito_userpool_name',
      webClientId: '_app_clientWeb',
      nativeClientId: '_app_client',
      identityPoolId: 'us-east-1:c67e98cc-144d-ca04-3b02-875aecfe0738',
      identityPoolName: 'identitypool_name',
      allowUnauthenticatedIdentities: false,
      authRoleArn: 'arn:aws:iam::123456789012:role/amplify-authimport-dev-123456-authRole',
      authRoleName: 'amplify-authimport-dev-123456-authRole',
      unauthRoleArn: 'arn:aws:iam::123456789012:role/amplify-authimport-dev-123456-unauthRole',
      unauthRoleName: 'amplify-authimport-dev-123456-unauthRole',
    });

    const props = getImportedAuthProperties(context);
    expect(props).toEqual({
      imported: true,
      userPoolId: 'us-east-1_ABCDEFGHI',
      authRoleArn: 'arn:aws:iam::123456789012:role/amplify-authimport-dev-123456-authRole',
      authRoleName: 'amplify-authimport-dev-123456-authRole',
      unauthRoleArn: 'arn:aws:iam::123456789012:role/amplify-authimport-dev-123456-unauthRole',
      unauthRoleName: 'amplify-authimport-dev-123456-unauthRole',
    });
  });

  it('returns imported auth properties when UserPool only imported', () => {
    context.amplify.getProjectDetails.mockReturnValue({
      amplifyMeta: {
        auth: {
          authResourceName: {
            service: 'Cognito',
            serviceType: 'imported',
            providerPlugin: 'awscloudformation',
          },
        },
      },
    });

    context.amplify.loadEnvResourceParameters.mockReturnValue({
      userPoolId: 'us-east-1_ABCDEFGHI',
      userPoolName: 'cognito_userpool_name',
      webClientId: '_app_clientWeb',
      nativeClientId: '_app_client',
    });

    const props = getImportedAuthProperties(context);
    expect(props).toEqual({
      imported: true,
      userPoolId: 'us-east-1_ABCDEFGHI',
    });
  });

  it('returns imported false when no imported auth resources exists', () => {
    context.amplify.getProjectDetails.mockReturnValue({
      amplifyMeta: {
        auth: {
          authResourceName: {
            service: 'Cognito',
            serviceType: 'managed',
            providerPlugin: 'awscloudformation',
          },
        },
      },
    });

    const props = getImportedAuthProperties(context);
    expect(props).toEqual({
      imported: false,
    });
  });

  it('returns imported false when no auth category resources exists', () => {
    context.amplify.getProjectDetails.mockReturnValue({
      amplifyMeta: {},
    });

    const props = getImportedAuthProperties(context);
    expect(props).toEqual({
      imported: false,
    });
  });
});
