import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { createIdentityPoolService } from '../../aws-utils/IdentityPoolService';
import { loadConfiguration } from '../../configuration-manager';

let mockCognitoIdentityRoles = {
  authenticated: 'arn:aws:iam::123456789012:role/service-role/my-auth-role',
  unauthenticated: 'arn:aws:iam::123456789012:role/service-role/my-unauth-role',
};

const iamRoleNameRegex = /[\w+=,.@-]+/;

jest.mock('aws-sdk', () => {
  return {
    CognitoIdentity: jest.fn(() => {
      return {
        config: {},
        getIdentityPoolRoles: jest.fn().mockImplementation(() => ({
          promise: async () => {
            return {
              Roles: mockCognitoIdentityRoles,
            };
          },
        })),
      };
    }),
  };
});

jest.mock('../../configuration-manager', () => {
  return {
    loadConfiguration: jest.fn().mockReturnValue({}) as jest.MockedFunction<typeof loadConfiguration>,
  };
});

describe('IdentityPoolService', () => {
  it('should correctly parse arn if it contains multiple forward slashes', async () => {
    const idpService = await createIdentityPoolService({} as unknown as $TSContext, {});
    const identityPoolRoles = await idpService.getIdentityPoolRoles('mockIdpId', 'mock-region');

    // ensure role names match regex for IAM
    // see: https://docs.aws.amazon.com/IAM/latest/APIReference/API_Role.html
    expect(identityPoolRoles.authRoleName).toMatch(iamRoleNameRegex);
    expect(identityPoolRoles.unauthRoleName).toMatch(iamRoleNameRegex);

    expect(identityPoolRoles).toEqual({
      authRoleArn: 'arn:aws:iam::123456789012:role/service-role/my-auth-role',
      authRoleName: 'my-auth-role',
      unauthRoleArn: 'arn:aws:iam::123456789012:role/service-role/my-unauth-role',
      unauthRoleName: 'my-unauth-role',
    });
  });

  it('should correctly parse arn if it contains a single forward slash', async () => {
    const idpService = await createIdentityPoolService({} as unknown as $TSContext, {});
    mockCognitoIdentityRoles = {
      authenticated: 'arn:aws:iam::123456789012:role/my-auth-role',
      unauthenticated: 'arn:aws:iam::123456789012:role/my-unauth-role',
    };

    const identityPoolRoles = await idpService.getIdentityPoolRoles('mockIdpId', 'mock-region');

    // ensure role names match regex for IAM
    // see: https://docs.aws.amazon.com/IAM/latest/APIReference/API_Role.html
    expect(identityPoolRoles.authRoleName).toMatch(iamRoleNameRegex);
    expect(identityPoolRoles.unauthRoleName).toMatch(iamRoleNameRegex);

    expect(identityPoolRoles).toEqual({
      authRoleArn: 'arn:aws:iam::123456789012:role/my-auth-role',
      authRoleName: 'my-auth-role',
      unauthRoleArn: 'arn:aws:iam::123456789012:role/my-unauth-role',
      unauthRoleName: 'my-unauth-role',
    });
  });

  it('should fail to parse arn if it contains no forward slash', async () => {
    const idpService = await createIdentityPoolService({} as unknown as $TSContext, {});
    mockCognitoIdentityRoles = {
      authenticated: 'arn:aws:iam::123456789012:my-auth-role',
      unauthenticated: 'arn:aws:iam::123456789012:my-unauth-role',
    };

    await expect(idpService.getIdentityPoolRoles('mockIdpId', 'mock-region')).rejects.toBeDefined();
  });
});
