import { migrateResourcesToCfn, exportHostedUIProvidersFromCurrCloudRootStack } from '../../utils/migrate-idp-resources';

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

      if (path === 'root-stack.json') {
        const hostedUIProviderCreds = JSON.stringify([
          {
            ProviderName: 'Facebook',
            client_id: 'fb_client',
            client_secret: 'fb_secret',
          },
          {
            ProviderName: 'Google',
            client_id: 'gg_client',
            client_secret: 'gg_secret',
          },
        ]);

        return {
          Resources: {
            authauthtest: {
              Properties: {
                Parameters: {
                  hostedUIProviderCreds,
                },
              },
            },
          },
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
    getCurrentCloudRootStackCfnTemplatePath: jest.fn().mockReturnValue('root-stack.json'),
  },
}));

describe('migrateResourcesToCfn', () => {
  describe('when idps exist with lambda and not migrated', () => {
    it('returns true', () => {
      expect(migrateResourcesToCfn('authtest1')).toBe(true);
    });
  });

  describe('when idps do not exist', () => {
    it('returns false', () => {
      expect(migrateResourcesToCfn('newapp')).toBe(false);
    });
  });

  describe('when idps in migration step', () => {
    it('returns false', () => {
      expect(migrateResourcesToCfn('authtest2')).toBe(false);
    });
  });
});

describe('exportHostedUIProvidersFromCurrCloudRootStack', () => {
  describe('when credentials exist and have not been updated', () => {
    it('exports existing credentials from root stack', () => {
      const providerCreds = [
        {
          ProviderName: 'Facebook',
        },
        {
          ProviderName: 'Google',
        },
      ];

      const results = exportHostedUIProvidersFromCurrCloudRootStack('authtest', providerCreds);

      expect(results[0]).toEqual({
        ProviderName: 'Facebook',
        client_id: 'fb_client',
        client_secret: 'fb_secret',
      });

      expect(results[1]).toEqual({
        ProviderName: 'Google',
        client_id: 'gg_client',
        client_secret: 'gg_secret',
      });
    });
  });

  describe('when credentials exist and have been updated', () => {
    it('maintains updated credentials', () => {
      const providerCreds = [
        {
          ProviderName: 'Facebook',
          client_id: 'updated_fb_client',
          client_secret: 'updated_fb_secret',
        },
        {
          ProviderName: 'Google',
          client_id: 'updated_gg_client',
          client_secret: 'updated_gg_secret',
        },
      ];

      const results = exportHostedUIProvidersFromCurrCloudRootStack('authtest', providerCreds);

      expect(results[0]).toEqual({
        ProviderName: 'Facebook',
        client_id: 'updated_fb_client',
        client_secret: 'updated_fb_secret',
      });

      expect(results[1]).toEqual({
        ProviderName: 'Google',
        client_id: 'updated_gg_client',
        client_secret: 'updated_gg_secret',
      });
    });
  });

  describe('when some credentials have been updated', () => {
    it('updates some credentials', () => {
      const providerCreds = [
        {
          ProviderName: 'Facebook',
        },
        {
          ProviderName: 'Google',
          client_id: 'updated_gg_client',
          client_secret: 'updated_gg_secret',
        },
      ];

      const results = exportHostedUIProvidersFromCurrCloudRootStack('authtest', providerCreds);

      expect(results[0]).toEqual({
        ProviderName: 'Facebook',
        client_id: 'fb_client',
        client_secret: 'fb_secret',
      });

      expect(results[1]).toEqual({
        ProviderName: 'Google',
        client_id: 'updated_gg_client',
        client_secret: 'updated_gg_secret',
      });
    });
  });
});
