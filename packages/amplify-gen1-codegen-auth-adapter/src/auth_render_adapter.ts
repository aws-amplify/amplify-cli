import { AuthDefinition, EmailOptions, LoginOptions, PasswordPolicyPath } from '@aws-amplify/amplify-gen2-codegen';
import { MultifactorOptions } from '@aws-amplify/amplify-gen2-codegen/src/auth/source_builder';
import { PasswordPolicyType, UserPoolMfaType, UserPoolType } from '@aws-sdk/client-cognito-identity-provider';

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
const getPasswordPolicyOverrides = (passwordPolicy: Partial<PasswordPolicyType>): Partial<Record<PasswordPolicyPath, any>> => {
  const policyOverrides: Partial<Record<PasswordPolicyPath, any>> = {};
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
  };
};
