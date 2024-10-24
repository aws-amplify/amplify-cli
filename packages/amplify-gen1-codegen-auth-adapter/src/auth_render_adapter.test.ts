import assert from 'node:assert';
import { IdentityProviderTypeType, LambdaConfigType, PasswordPolicyType, UserPoolMfaType } from '@aws-sdk/client-cognito-identity-provider';
import { DEFAULT_PASSWORD_SETTINGS, getAuthDefinition } from './auth_render_adapter';
import { Attribute, AuthTriggerEvents, StandardAttribute, StandardAttributes } from '@aws-amplify/amplify-gen2-codegen';
/**
 * @see https://github.com/aws-amplify/amplify-backend/blob/5d78622c7fd6fb050da11baff1295b9be0bd2eae/packages/auth-construct/src/construct.test.ts#L578
 * for examples of assertions in the cli codebase
 */

void describe('auth codegen', () => {
  void describe('identity providers', () => {
    void it('contains google login if Google identityProvider type is passed', () => {
      const result = getAuthDefinition({
        userPool: {},
        identityProviders: [{ ProviderType: IdentityProviderTypeType.Google, ProviderName: 'Google' }],
      });
      assert(result.loginOptions?.googleLogin);
    });
    void it('contains apple login if SignInWithApple identityProvider type is passed', () => {
      const result = getAuthDefinition({
        userPool: {},
        identityProviders: [{ ProviderType: IdentityProviderTypeType.SignInWithApple, ProviderName: 'SignInWithApple' }],
      });
      assert(result.loginOptions?.appleLogin);
    });
    void it('contains amazon login if LoginWithAmazon identityProvider type is passed', () => {
      const result = getAuthDefinition({
        userPool: {},
        identityProviders: [{ ProviderType: IdentityProviderTypeType.LoginWithAmazon, ProviderName: 'LoginWithAmazon' }],
      });
      assert(result.loginOptions?.amazonLogin);
    });
    void it('contains facebook login if Facebook identityProvider type is passed', () => {
      const result = getAuthDefinition({
        userPool: {},
        identityProviders: [{ ProviderType: IdentityProviderTypeType.Facebook, ProviderName: 'Facebook' }],
      });
      assert(result.loginOptions?.facebookLogin);
    });
    void it('contains oidc login if OIDC identityProvider type is passed', () => {
      const result = getAuthDefinition({
        userPool: {},
        identityProvidersDetails: [
          { ProviderType: IdentityProviderTypeType.OIDC, ProviderName: 'OIDC_1', ProviderDetails: { oidc_issuer: 'https://example.com' } },
          { ProviderType: IdentityProviderTypeType.OIDC, ProviderName: 'OIDC_2', ProviderDetails: { oidc_issuer: 'https://example.com' } },
        ],
      });
      assert(result.loginOptions?.oidcLogin);
    });
    void it('contains SAML login if SAML identityProvider type is passed', () => {
      const result = getAuthDefinition({
        userPool: {},
        identityProvidersDetails: [
          {
            ProviderType: IdentityProviderTypeType.SAML,
            ProviderName: 'SAML_1',
            ProviderDetails: { metadataContent: 'https://example.com' },
          },
        ],
      });
      assert(result.loginOptions?.samlLogin);
    });
  });
  void describe('OIDC and SAML providers', () => {
    void describe('OIDC', () => {
      void it('contains name and issuerUrl if OIDC identityProviderDetails is passed', () => {
        const result = getAuthDefinition({
          userPool: {},
          identityProvidersDetails: [
            {
              ProviderType: IdentityProviderTypeType.OIDC,
              ProviderName: 'OIDC_1',
              ProviderDetails: {
                oidc_issuer: 'https://example.com',
                authorize_url: 'https://example.com',
                token_url: 'https://example.com',
                attributes_url: 'https://example.com',
                jwks_uri: 'https://example.com',
              },
            },
            {
              ProviderType: IdentityProviderTypeType.OIDC,
              ProviderName: 'OIDC_2',
              ProviderDetails: { oidc_issuer: 'https://example.com' },
            },
          ],
        });
        assert.deepEqual(result.loginOptions?.oidcLogin, [
          {
            endpoints: {
              authorization: 'https://example.com',
              token: 'https://example.com',
              userInfo: 'https://example.com',
              jwksUri: 'https://example.com',
            },
            issuerUrl: 'https://example.com',
            name: 'OIDC_1',
          },
          { issuerUrl: 'https://example.com', name: 'OIDC_2' },
        ]);
      });
      void it('contains attributeMapping if AttributeMapping is passed', () => {
        const result = getAuthDefinition({
          userPool: {},
          identityProvidersDetails: [
            {
              ProviderType: IdentityProviderTypeType.OIDC,
              ProviderName: 'OIDC_1',
              ProviderDetails: { oidc_issuer: 'https://example.com' },
              AttributeMapping: { name: 'name', phone_number: 'phone_number' },
            },
            {
              ProviderType: IdentityProviderTypeType.OIDC,
              ProviderName: 'OIDC_2',
              ProviderDetails: { oidc_issuer: 'https://example.com' },
              AttributeMapping: { name: 'name', phone_number: 'phone_number' },
            },
          ],
        });
        assert.deepEqual(result.loginOptions?.oidcLogin, [
          { issuerUrl: 'https://example.com', name: 'OIDC_1', attributeMapping: { fullname: 'name', phoneNumber: 'phone_number' } },
          { issuerUrl: 'https://example.com', name: 'OIDC_2', attributeMapping: { fullname: 'name', phoneNumber: 'phone_number' } },
        ]);
      });
    });
    void describe('SAML', () => {
      void it('contains metadataType URL if SAML identityProviderDetails and metadataURL is passed', () => {
        const result = getAuthDefinition({
          userPool: {},
          identityProvidersDetails: [
            {
              ProviderType: IdentityProviderTypeType.SAML,
              ProviderName: 'SAML_1',
              ProviderDetails: { metadataURL: 'https://example.com' },
            },
          ],
        });
        assert.deepEqual(result.loginOptions?.samlLogin, {
          metadata: { metadataContent: 'https://example.com', metadataType: 'URL' },
          name: 'SAML_1',
        });
      });
      void it('contains metadataType FILE if SAML identityProviderDetails and metadataContent is passed', () => {
        const result = getAuthDefinition({
          userPool: {},
          identityProvidersDetails: [
            {
              ProviderType: IdentityProviderTypeType.SAML,
              ProviderName: 'SAML_1',
              ProviderDetails: { metadataContent: 'https://example.com' },
            },
          ],
        });
        assert.deepEqual(result.loginOptions?.samlLogin, {
          metadata: { metadataContent: 'https://example.com', metadataType: 'FILE' },
          name: 'SAML_1',
        });
      });
      void it('contains attributeMapping if AttributeMapping is passed', () => {
        const result = getAuthDefinition({
          userPool: {},
          identityProvidersDetails: [
            {
              ProviderType: IdentityProviderTypeType.SAML,
              ProviderName: 'SAML_1',
              ProviderDetails: { metadataContent: 'https://example.com' },
              AttributeMapping: { name: 'name', phone_number: 'phone_number' },
            },
          ],
        });
        assert.deepEqual(result.loginOptions?.samlLogin, {
          attributeMapping: { fullname: 'name', phoneNumber: 'phone_number' },
          metadata: { metadataContent: 'https://example.com', metadataType: 'FILE' },
          name: 'SAML_1',
        });
      });
    });
    void it('contains oidc login if OIDC identityProvider type is passed', () => {
      const result = getAuthDefinition({
        userPool: {},
        identityProvidersDetails: [
          { ProviderType: IdentityProviderTypeType.OIDC, ProviderName: 'OIDC_1', ProviderDetails: { oidc_issuer: 'https://example.com' } },
          { ProviderType: IdentityProviderTypeType.OIDC, ProviderName: 'OIDC_2', ProviderDetails: { oidc_issuer: 'https://example.com' } },
        ],
      });
      assert(result.loginOptions?.oidcLogin);
    });
    void it('contains SAML login if SAML identityProvider type is passed', () => {
      const result = getAuthDefinition({
        userPool: {},
        identityProvidersDetails: [
          {
            ProviderType: IdentityProviderTypeType.SAML,
            ProviderName: 'SAML_1',
            ProviderDetails: { metadataContent: 'https://example.com' },
          },
        ],
      });
      assert(result.loginOptions?.samlLogin);
    });
  });
  void describe('OIDC and SAML providers', () => {
    void describe('OIDC', () => {
      void it('contains name and issuerUrl if OIDC identityProviderDetails is passed', () => {
        const result = getAuthDefinition({
          userPool: {},
          identityProvidersDetails: [
            {
              ProviderType: IdentityProviderTypeType.OIDC,
              ProviderName: 'OIDC_1',
              ProviderDetails: {
                oidc_issuer: 'https://example.com',
                authorize_url: 'https://example.com',
                token_url: 'https://example.com',
                attributes_url: 'https://example.com',
                jwks_uri: 'https://example.com',
              },
            },
            {
              ProviderType: IdentityProviderTypeType.OIDC,
              ProviderName: 'OIDC_2',
              ProviderDetails: { oidc_issuer: 'https://example.com' },
            },
          ],
        });
        assert.deepEqual(result.loginOptions?.oidcLogin, [
          {
            endpoints: {
              authorization: 'https://example.com',
              token: 'https://example.com',
              userInfo: 'https://example.com',
              jwksUri: 'https://example.com',
            },
            issuerUrl: 'https://example.com',
            name: 'OIDC_1',
          },
          { issuerUrl: 'https://example.com', name: 'OIDC_2' },
        ]);
      });
      void it('contains attributeMapping if AttributeMapping is passed', () => {
        const result = getAuthDefinition({
          userPool: {},
          identityProvidersDetails: [
            {
              ProviderType: IdentityProviderTypeType.OIDC,
              ProviderName: 'OIDC_1',
              ProviderDetails: { oidc_issuer: 'https://example.com' },
              AttributeMapping: { name: 'name', phone_number: 'phone_number' },
            },
            {
              ProviderType: IdentityProviderTypeType.OIDC,
              ProviderName: 'OIDC_2',
              ProviderDetails: { oidc_issuer: 'https://example.com' },
              AttributeMapping: { name: 'name', phone_number: 'phone_number' },
            },
          ],
        });
        assert.deepEqual(result.loginOptions?.oidcLogin, [
          { issuerUrl: 'https://example.com', name: 'OIDC_1', attributeMapping: { fullname: 'name', phoneNumber: 'phone_number' } },
          { issuerUrl: 'https://example.com', name: 'OIDC_2', attributeMapping: { fullname: 'name', phoneNumber: 'phone_number' } },
        ]);
      });
    });
    void describe('SAML', () => {
      void it('contains metadataType URL if SAML identityProviderDetails and metadataURL is passed', () => {
        const result = getAuthDefinition({
          userPool: {},
          identityProvidersDetails: [
            {
              ProviderType: IdentityProviderTypeType.SAML,
              ProviderName: 'SAML_1',
              ProviderDetails: { metadataURL: 'https://example.com' },
            },
          ],
        });
        assert.deepEqual(result.loginOptions?.samlLogin, {
          metadata: { metadataContent: 'https://example.com', metadataType: 'URL' },
          name: 'SAML_1',
        });
      });
      void it('contains metadataType FILE if SAML identityProviderDetails and metadataContent is passed', () => {
        const result = getAuthDefinition({
          userPool: {},
          identityProvidersDetails: [
            {
              ProviderType: IdentityProviderTypeType.SAML,
              ProviderName: 'SAML_1',
              ProviderDetails: { metadataContent: 'https://example.com' },
            },
          ],
        });
        assert.deepEqual(result.loginOptions?.samlLogin, {
          metadata: { metadataContent: 'https://example.com', metadataType: 'FILE' },
          name: 'SAML_1',
        });
      });
      void it('contains attributeMapping if AttributeMapping is passed', () => {
        const result = getAuthDefinition({
          userPool: {},
          identityProvidersDetails: [
            {
              ProviderType: IdentityProviderTypeType.SAML,
              ProviderName: 'SAML_1',
              ProviderDetails: { metadataContent: 'https://example.com' },
              AttributeMapping: { name: 'name', phone_number: 'phone_number' },
            },
          ],
        });
        assert.deepEqual(result.loginOptions?.samlLogin, {
          attributeMapping: { fullname: 'name', phoneNumber: 'phone_number' },
          metadata: { metadataContent: 'https://example.com', metadataType: 'FILE' },
          name: 'SAML_1',
        });
      });
    });
  });
  void describe('callback URLs and logout URLs', () => {
    void it('contains callback urls if callbackURLs array is passed', () => {
      const result = getAuthDefinition({ userPool: {}, webClient: { CallbackURLs: ['https://example.com/callback'] } });
      assert.deepEqual(result.loginOptions?.callbackURLs, ['https://example.com/callback']);
    });
    void it('contains logout urls if logoutURLs array is passed', () => {
      const result = getAuthDefinition({ userPool: {}, webClient: { LogoutURLs: ['https://example.com/logout'] } });
      assert.deepEqual(result.loginOptions?.logoutURLs, ['https://example.com/logout']);
    });
  });
  void describe('no login parameters are provided', () => {
    void it('loginWith contains `email: true`', () => {
      const result = getAuthDefinition({ userPool: {} });
      assert.deepEqual(result.loginOptions, { email: true });
    });
  });
  void describe('`Enable users to login with phone` is selected', () => {
    void it('loginWith contains `phone: true`', () => {
      const result = getAuthDefinition({ userPool: { UsernameAttributes: ['phone_number'] } });
      assert(result.loginOptions?.phone);
    });
  });
  void describe('Password policy', () => {
    void describe('gen 2 defaults', () => {
      const defaultPasswordPolicy: PasswordPolicyType = DEFAULT_PASSWORD_SETTINGS;
      for (const key in defaultPasswordPolicy) {
        const typedKey = key as keyof PasswordPolicyType;
        const testValue = defaultPasswordPolicy[typedKey];
        void it(`does explicitly override the value for ${typedKey} when set to the default value of ${testValue}`, () => {
          const result = getAuthDefinition({
            userPool: {
              Policies: {
                PasswordPolicy: {
                  [typedKey]: testValue,
                },
              },
            },
          });
          assert(`Policies.PasswordPolicy.${typedKey}` in result.userPoolOverrides!);
        });
      }
    });
    void describe('overrides', () => {
      type PasswordPolicyTestCase = {
        [Property in keyof PasswordPolicyType]: Array<PasswordPolicyType[Property]>;
      };
      const passwordPolicyTestCases: PasswordPolicyTestCase = {
        MinimumLength: [-Number.MAX_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER],
        RequireUppercase: [false],
        RequireLowercase: [false],
        RequireNumbers: [false],
        RequireSymbols: [true, false],
        TemporaryPasswordValidityDays: [-Number.MAX_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER],
      };

      for (const key in passwordPolicyTestCases) {
        const typedKey = key as keyof PasswordPolicyType;
        for (const testValue of passwordPolicyTestCases[typedKey]!) {
          void it(`sets the ${typedKey} to ${testValue}`, () => {
            const result = getAuthDefinition({
              userPool: {
                Policies: {
                  PasswordPolicy: {
                    [typedKey]: testValue,
                  },
                },
              },
            });
            assert.equal(result.userPoolOverrides?.[`Policies.PasswordPolicy.${typedKey}`], testValue);
          });
        }
      }
    });
  });
  void describe('MFA settings', () => {
    const modeMap: Record<UserPoolMfaType, string> = {
      ON: 'REQUIRED',
      OFF: 'OFF',
      OPTIONAL: 'OPTIONAL',
    };

    for (const mode of Object.keys(modeMap)) {
      void describe(`when ${mode} is passed to mfa`, () => {
        void it(`sets multifactor to ${mode}`, () => {
          const result = getAuthDefinition({
            userPool: {},
            mfaConfig: mode as UserPoolMfaType,
            totpConfig: { Enabled: true },
          });
          if (mode === 'OFF') {
            assert.deepEqual(result.mfa, {
              mode: modeMap[mode as UserPoolMfaType],
            });
          } else {
            assert.deepEqual(result.mfa, {
              mode: modeMap[mode as UserPoolMfaType],
              sms: true,
              totp: true,
            });
          }
        });
      });
    }
    void describe('no MFA setting parameter is provided', () => {
      void it('sets mode to off', () => {
        const result = getAuthDefinition({ userPool: {} });
        assert.deepEqual(result.mfa, {
          mode: 'OFF',
        });
      });
    });
  });
  void describe('Email verification settings', () => {
    void it('it sets email verification with code message', () => {
      const emailMessage = 'Your verification code is {####}';
      const result = getAuthDefinition({
        userPool: {
          EmailVerificationMessage: emailMessage,
        },
      });
      assert.equal(result.loginOptions?.emailOptions?.emailVerificationBody, emailMessage);
    });
    void it('sets email verification with code subject', () => {
      const emailSubject = 'Your verification code';
      const result = getAuthDefinition({
        userPool: { EmailVerificationSubject: emailSubject },
      });
      assert.equal(result.loginOptions?.emailOptions?.emailVerificationSubject, emailSubject);
    });
  });
  void describe('Triggers', () => {
    type triggerTestCase = [keyof LambdaConfigType, AuthTriggerEvents];
    const testCases: triggerTestCase[] = [
      ['PreSignUp', 'preSignUp'],
      ['CustomMessage', 'customMessage'],
      ['UserMigration', 'userMigration'],
      ['PostConfirmation', 'postConfirmation'],
      ['PreAuthentication', 'preAuthentication'],
      ['PostAuthentication', 'postAuthentication'],
      ['PreTokenGeneration', 'preTokenGeneration'],
      ['DefineAuthChallenge', 'defineAuthChallenge'],
      ['CreateAuthChallenge', 'createAuthChallenge'],
      ['VerifyAuthChallengeResponse', 'verifyAuthChallengeResponse'],
    ];
    for (const [lambdaConfigKey, authEventKey] of testCases) {
      void it(`adapts user pool lambda config key ${lambdaConfigKey} to triggers ${authEventKey}`, () => {
        const result = getAuthDefinition({
          userPool: { LambdaConfig: { [lambdaConfigKey]: {} } },
        });
        assert(result.lambdaTriggers);
        assert.deepEqual(result.lambdaTriggers[authEventKey], { source: '' });
      });
    }
  });

  void describe('User attributes', () => {
    void describe('Sign-up Standard User Attributes', () => {
      const mappedUserAttributeName = {
        address: 'address',
        birthdate: 'birthdate',
        email: 'email',
        family_name: 'familyName',
        gender: 'gender',
        given_name: 'givenName',
        locale: 'locale',
        middle_name: 'middleName',
        name: 'fullname',
        nickname: 'nickname',
        phone_number: 'phoneNumber',
        picture: 'profilePicture',
        preferred_username: 'preferredUsername',
        profile: 'profilePage',
        zoneinfo: 'timezone',
        updated_at: 'lastUpdateTime',
        website: 'website',
      };
      for (const key in mappedUserAttributeName) {
        const typedKey = key as keyof typeof mappedUserAttributeName;
        const testValue = mappedUserAttributeName[typedKey];
        void it(`sets the attribute.Name ${typedKey} to ${testValue}`, () => {
          const result = getAuthDefinition({
            userPool: { SchemaAttributes: [{ Name: typedKey, Required: true, Mutable: false }] },
          });
          assert.deepEqual(result.standardUserAttributes, {
            [testValue as Attribute]: { required: true, mutable: false } as StandardAttribute,
          } as StandardAttributes);
        });
      }
      void it('sets the standard attributes to empty object if no attributes are passed', () => {
        const result = getAuthDefinition({
          userPool: {},
        });
        assert.deepEqual(result.standardUserAttributes, {});
      });
    });
    void describe('Custom User Attributes', () => {
      void it('sets the custom attributes', () => {
        const result = getAuthDefinition({
          userPool: {
            SchemaAttributes: [
              {
                Name: 'custom:Test1',
                AttributeDataType: 'Number',
                Mutable: true,
                NumberAttributeConstraints: { MinValue: '10', MaxValue: '100' },
              },
              {
                Name: 'custom:Test2',
                AttributeDataType: 'String',
                Mutable: true,
                StringAttributeConstraints: { MinLength: '10', MaxLength: '100' },
              },
            ],
          },
        });
        assert.deepEqual(result.customUserAttributes, {
          'custom:Test1': { dataType: 'Number', mutable: true, min: 10, max: 100 },
          'custom:Test2': { dataType: 'String', mutable: true, minLen: 10, maxLen: 100 },
        });
      });
      void it('sets the custom attributes to empty object if no custom attributes are passed', () => {
        const result = getAuthDefinition({
          userPool: {},
        });
        assert.deepEqual(result.customUserAttributes, {});
      });
    });
  });

  void describe('User pool Groups', () => {
    void it('sets the group names and sorts according to precedence', () => {
      const result = getAuthDefinition({
        userPool: {},
        identityGroups: [
          { GroupName: 'group3', Precedence: 3 },
          { GroupName: 'group1', Precedence: 1 },
          { GroupName: 'group2', Precedence: 2 },
        ],
      });
      assert.deepEqual(result.groups, ['group1', 'group2', 'group3']);
    });
    void it('sets the group names to empty array if no groups are passed', () => {
      const result = getAuthDefinition({
        userPool: {},
        identityGroups: [],
      });
      assert.deepEqual(result.groups, []);
    });
  });
  void describe('Oauth Scopes', () => {
    void it('sets the oauth scopes', () => {
      const result = getAuthDefinition({
        userPool: {},
        webClient: { AllowedOAuthScopes: ['email', 'openid', 'aws.cognito.signin.user.admin'] },
      });
      assert.deepEqual(result.loginOptions?.scopes, ['EMAIL', 'OPENID', 'COGNITO_ADMIN']);
    });
    void it('Does not render anything if no oauth scopes are passed', () => {
      const result = getAuthDefinition({
        userPool: {},
        webClient: {},
      });
      assert(result.loginOptions?.scopes === undefined);
    });
  });
  void describe('Unauthenticated Login', () => {
    void it('sets the guestLogin to true', () => {
      const result = getAuthDefinition({
        userPool: {},
        guestLogin: true,
      });
      assert(result.guestLogin);
    });
    void it('sets the guestLogin to false', () => {
      const result = getAuthDefinition({
        userPool: {},
        guestLogin: false,
      });
      assert(!result.guestLogin);
    });
  });
  void describe('UserPool Name', () => {
    void it('sets the userPool name', () => {
      const result = getAuthDefinition({
        userPool: { Name: 'test' },
      });
      assert.deepEqual(result.userPoolOverrides, { userPoolName: 'test', usernameAttributes: undefined });
    });
  });
});
