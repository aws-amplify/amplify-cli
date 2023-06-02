import { migrateResourcesToCfn } from '../../../../provider-utils/awscloudformation/utils/migrate-idp-resources';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as Record<string, unknown>),
  JSONUtilities: {
    readJson: jest.fn().mockImplementation((path) => {
      if (path === 'without-cfn-resources.json') {
        return {
          Resources: {
            HostedUIProvidersCustomResource: {
              Type: 'AWS::Lambda::Function',
            },
          },
        };
      }

      if (path === 'with-cfn-resources.json') {
        return {
          Resources: {
            HostedUIProvidersCustomResource: {
              Type: 'AWS::Lambda::Function',
            },
            HostedUIGoogleProviderResource: {
              Type: 'AWS::Cognito::UserPoolIdentityProvider',
            },
          },
        };
      }

      if (path === 'new-app.json') {
        return {
          Resources: {},
        };
      }
    }),
  },
  pathManager: {
    getCurrentCfnTemplatePathFromBuild: jest.fn().mockImplementation((_, name) => {
      if (name === 'authtest1') return 'without-cfn-resources.json';

      if (name === 'authtest2') return 'with-cfn-resources.json';

      if (name === 'newapp') return 'new-app.json';
    }),
    getCurrentCloudRootStackCfnTemplatePath: jest.fn().mockReturnValue(''),
  },
}));

describe('migrateResourcesToCfn', () => {
  it('returns true when not migrated', () => {
    expect(migrateResourcesToCfn('authtest1')).toBe(true);
  });

  it('returns false when idps do not exist', () => {
    expect(migrateResourcesToCfn('authtest2')).toBe(false);
  });

  it('returns false when idps in migration step', () => {
    expect(migrateResourcesToCfn('authtest2')).toBe(false);
  });
});

describe('exportHostedUIProvidersFromCurrCloudRootStack', () => {
  
});
