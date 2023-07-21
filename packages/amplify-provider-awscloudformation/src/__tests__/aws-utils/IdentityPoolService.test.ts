import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { createIdentityPoolService } from '../../aws-utils/IdentityPoolService';
import { loadConfiguration } from '../../configuration-manager';

jest.mock('aws-sdk', () => {
  return {
    CognitoIdentity: jest.fn(() => {
      return {
        config: {},
        getIdentityPoolRoles: jest.fn().mockImplementation(() => ({
          promise: async () => {
            return {
              Roles: {
                authenticated: 'arn:aws:iam::123456789012:role/service-role/my-auth-role',
                unauthenticated: 'arn:aws:iam::123456789012:role/service-role/my-unauth-role',
              },
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
    expect(await idpService.getIdentityPoolRoles('mockIdpId')).toEqual({
      authRoleArn: 'arn:aws:iam::123456789012:role/service-role/my-auth-role',
      authRoleName: 'my-auth-role',
      unauthRoleArn: 'arn:aws:iam::123456789012:role/service-role/my-unauth-role',
      unauthRoleName: 'my-unauth-role',
    });
  });
});
