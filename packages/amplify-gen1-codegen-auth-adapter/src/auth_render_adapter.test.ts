import assert from 'node:assert';
import { LambdaConfigType, PasswordPolicyType, UserPoolMfaType } from '@aws-sdk/client-cognito-identity-provider';
import { DEFAULT_PASSWORD_SETTINGS, getAuthDefinition } from './auth_render_adapter';
import { AuthTriggerEvents } from '@aws-amplify/amplify-gen2-codegen';
/**
 * @see https://github.com/aws-amplify/amplify-backend/blob/5d78622c7fd6fb050da11baff1295b9be0bd2eae/packages/auth-construct/src/construct.test.ts#L578
 * for examples of assertions in the cli codebase
 */

void describe('auth codegen', () => {
  void describe('no login parameters are provided', () => {
    void it('loginWith contains `email: true`', () => {
      const result = getAuthDefinition({ userPool: {} });
      assert.deepEqual(result.loginOptions, { email: true });
    });
  });
  void describe('Password policy', () => {
    void describe('gen 2 defaults', () => {
      const defaultPasswordPolicy: PasswordPolicyType = DEFAULT_PASSWORD_SETTINGS;
      for (const key in defaultPasswordPolicy) {
        const typedKey = key as keyof PasswordPolicyType;
        const testValue = defaultPasswordPolicy[typedKey];
        void it(`does not explicitly override the value for ${typedKey} when set to the default value of ${testValue}`, () => {
          const result = getAuthDefinition({
            userPool: {
              Policies: {
                PasswordPolicy: {
                  [typedKey]: testValue,
                },
              },
            },
          });
          assert(!(`Policies.PasswordPolicy.${typedKey}` in result.userPoolOverrides!));
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
    const modes: UserPoolMfaType[] = ['ON', 'OFF', 'OPTIONAL'];
    for (const mode of modes) {
      void describe(`when ${mode} is passed to mfa`, () => {
        void it(`sets multifactor to ${mode}`, () => {
          const result = getAuthDefinition({
            userPool: { MfaConfiguration: mode },
          });
          assert.deepEqual(result.mfa, {
            mode,
          });
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
});
