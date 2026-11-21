import { generateKeyPairSync } from 'crypto';

type AWSCredentials = {
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_SESSION_TOKEN?: string;
};
type SocialProviders = {
  FACEBOOK_APP_ID?: string;
  FACEBOOK_APP_SECRET?: string;
  GOOGLE_APP_ID?: string;
  GOOGLE_APP_SECRET?: string;
  AMAZON_APP_ID?: string;
  AMAZON_APP_SECRET?: string;
  APPLE_APP_ID?: string;
  APPLE_TEAM_ID?: string;
  APPLE_KEY_ID?: string;
  APPLE_PRIVATE_KEY?: string;
};

type EnvironmentVariables = AWSCredentials & SocialProviders;

export function getEnvVars(): EnvironmentVariables {
  return { ...process.env } as EnvironmentVariables;
}

let ephemeralApplePrivateKey: string | undefined;

/**
 * Returns an ephemeral P-256 (ES256) private key for Sign in with Apple test configuration.
 *
 * Cognito only validates the key's structure when the provider is configured -- no request is made
 * to Apple -- so a key generated at run time satisfies validation without committing key material.
 *
 * The PEM is flattened to a single line because callers feed this value into interactive CLI
 * prompts, where an embedded newline would register as an Enter keypress. `extractApplePrivateKey`
 * strips whitespace and accepts any number of delimiter dashes, so the single-line form parses.
 *
 * The key is memoized so every caller in a test process observes the same value.
 */
export function getEphemeralApplePrivateKey(): string {
  if (!ephemeralApplePrivateKey) {
    const { privateKey } = generateKeyPairSync('ec', {
      namedCurve: 'prime256v1',
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    ephemeralApplePrivateKey = privateKey.replace(/\r?\n/g, '');
  }
  return ephemeralApplePrivateKey;
}

export function getSocialProviders(getEnv = false): SocialProviders {
  if (!getEnv) {
    return {
      FACEBOOK_APP_ID: 'fbAppId',
      FACEBOOK_APP_SECRET: 'fbAppSecret',
      GOOGLE_APP_ID: 'gglAppID',
      GOOGLE_APP_SECRET: 'gglAppSecret',
      AMAZON_APP_ID: 'amaznAppID',
      AMAZON_APP_SECRET: 'amaznAppID',
      APPLE_APP_ID: 'com.fake.app',
      APPLE_TEAM_ID: '2QLEWNDK6K',
      APPLE_KEY_ID: '2QLZXKYJ8J',
      APPLE_PRIVATE_KEY: getEphemeralApplePrivateKey(),
    };
  }
  const {
    FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET,
    GOOGLE_APP_ID,
    GOOGLE_APP_SECRET,
    AMAZON_APP_ID,
    AMAZON_APP_SECRET,
    APPLE_APP_ID,
    APPLE_TEAM_ID,
    APPLE_KEY_ID,
    APPLE_PRIVATE_KEY_2,
  }: any = getEnvVars();

  const missingVars = [];
  if (!FACEBOOK_APP_ID) {
    missingVars.push('FACEBOOK_APP_ID');
  }
  if (!FACEBOOK_APP_SECRET) {
    missingVars.push('FACEBOOK_APP_SECRET');
  }
  if (!GOOGLE_APP_ID) {
    missingVars.push('GOOGLE_APP_ID');
  }
  if (!GOOGLE_APP_SECRET) {
    missingVars.push('GOOGLE_APP_SECRET');
  }
  if (!AMAZON_APP_ID) {
    missingVars.push('AMAZON_APP_ID');
  }
  if (!AMAZON_APP_SECRET) {
    missingVars.push('AMAZON_APP_SECRET');
  }
  if (!APPLE_APP_ID) {
    missingVars.push('APPLE_APP_ID');
  }
  if (!APPLE_TEAM_ID) {
    missingVars.push('APPLE_TEAM_ID');
  }
  if (!APPLE_KEY_ID) {
    missingVars.push('APPLE_KEY_ID');
  }

  if (missingVars.length > 0) {
    throw new Error(`.env file is missing the following key/values: ${missingVars.join(', ')} `);
  }
  return {
    FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET,
    GOOGLE_APP_ID,
    GOOGLE_APP_SECRET,
    AMAZON_APP_ID,
    AMAZON_APP_SECRET,
    APPLE_APP_ID,
    APPLE_TEAM_ID,
    APPLE_KEY_ID,
    APPLE_PRIVATE_KEY: APPLE_PRIVATE_KEY_2 || getEphemeralApplePrivateKey(),
  };
}
