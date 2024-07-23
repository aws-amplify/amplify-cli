import {
  Lambda,
  AuthDefinition,
  EmailOptions,
  LoginOptions,
  PasswordPolicyPath,
  AuthTriggerEvents,
  MultifactorOptions,
} from '@aws-amplify/amplify-gen2-codegen';
import { LambdaConfigType, PasswordPolicyType, UserPoolMfaType, UserPoolType } from '@aws-sdk/client-cognito-identity-provider';

export interface AuthSynthesizerOptions {
  userPool: UserPoolType;
}

export const DEFAULT_PASSWORD_SETTINGS: PasswordPolicyType = {
  MinimumLength: 8,
  RequireLowercase: true,
  RequireUppercase: true,
  RequireNumbers: true,
  TemporaryPasswordValidityDays: 3,
};

export type PasswordPolicyOverrides = Record<PasswordPolicyPath, string | boolean | number>;

const getPasswordPolicyOverrides = (passwordPolicy: Partial<PasswordPolicyType>): Partial<PasswordPolicyOverrides> => {
  const policyOverrides: Partial<PasswordPolicyOverrides> = {};
  const passwordOverridePath = (policyKey: keyof PasswordPolicyType): PasswordPolicyPath => `Policies.PasswordPolicy.${policyKey}`;
  for (const key of Object.keys(passwordPolicy)) {
    const typedKey: keyof PasswordPolicyType = key as keyof PasswordPolicyType;
    if (passwordPolicy[typedKey] !== undefined) {
      if (passwordPolicy[typedKey] === DEFAULT_PASSWORD_SETTINGS[typedKey]) {
        continue;
      }
      policyOverrides[passwordOverridePath(typedKey)] = passwordPolicy[typedKey];
    }
  }
  return policyOverrides;
};

const getMfaConfiguration = (mfa?: UserPoolMfaType): MultifactorOptions => {
  const multifactor: MultifactorOptions = {
    mode: 'OFF',
  };
  if (mfa === 'ON') {
    multifactor.mode = 'ON';
  }
  if (mfa === 'OPTIONAL') {
    multifactor.mode = 'OPTIONAL';
  }
  return multifactor;
};

const getEmailConfig = (userPool: UserPoolType): EmailOptions => {
  return {
    emailVerificationBody: userPool.EmailVerificationMessage ?? '',
    emailVerificationSubject: userPool.EmailVerificationSubject ?? '',
  };
};

const mappedLambdaConfigKey = (key: keyof LambdaConfigType): AuthTriggerEvents => {
  switch (key) {
    case 'PreSignUp':
      return 'preSignUp';
    case 'CustomMessage':
      return 'customMessage';
    case 'UserMigration':
      return 'userMigration';
    case 'PostConfirmation':
      return 'postConfirmation';
    case 'PreAuthentication':
      return 'preAuthentication';
    case 'PostAuthentication':
      return 'postAuthentication';
    case 'PreTokenGeneration':
      return 'preTokenGeneration';
    case 'DefineAuthChallenge':
      return 'defineAuthChallenge';
    case 'CreateAuthChallenge':
      return 'createAuthChallenge';
    case 'VerifyAuthChallengeResponse':
      return 'verifyAuthChallengeResponse';
    default:
      throw new Error('Could not map the provided key');
  }
};

const getAuthTriggers = (lambdaConfig: LambdaConfigType): Partial<Record<AuthTriggerEvents, Lambda>> => {
  return Object.keys(lambdaConfig).reduce((prev, key) => {
    prev[mappedLambdaConfigKey(key as keyof LambdaConfigType)] = { source: '' };
    return prev;
  }, {} as Partial<Record<AuthTriggerEvents, Lambda>>);
};

/**
 * [getAuthDefinition] describes gen 1 auth resources in terms that can be used to generate Gen 2 code.
 */
export const getAuthDefinition = ({ userPool }: AuthSynthesizerOptions): AuthDefinition => {
  const loginWith: LoginOptions = { email: true };
  if (userPool.EmailVerificationMessage || userPool.EmailVerificationSubject) {
    loginWith.emailOptions = getEmailConfig(userPool);
  }
  const userPoolOverrides = getPasswordPolicyOverrides(userPool.Policies?.PasswordPolicy ?? {});
  return {
    loginOptions: loginWith,
    mfa: getMfaConfiguration(userPool.MfaConfiguration),
    userPoolOverrides,
    lambdaTriggers: getAuthTriggers(userPool.LambdaConfig ?? {}),
  };
};
