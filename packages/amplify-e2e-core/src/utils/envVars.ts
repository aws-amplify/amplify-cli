type AWSCredentials = {
  ACCESS_KEY_ID?: string;
  SECRET_ACCESS_KEY?: string;
};
type SocialProviders = {
  FACEBOOK_APP_ID?: string;
  FACEBOOK_APP_SECRET?: string;
  GOOGLE_APP_ID?: string;
  GOOGLE_APP_SECRET?: string;
  AMAZON_APP_ID?: string;
  AMAZON_APP_SECRET?: string;
};

type EnvironmentVariables = AWSCredentials & SocialProviders;

export function getEnvVars(): EnvironmentVariables {
  return { ...process.env } as EnvironmentVariables;
}

export function getSocialProviders(getEnv: boolean = false): SocialProviders {
  if (!getEnv) {
    return {
      FACEBOOK_APP_ID: 'fbAppId',
      FACEBOOK_APP_SECRET: 'fbAppSecret',
      GOOGLE_APP_ID: 'gglAppID',
      GOOGLE_APP_SECRET: 'gglAppSecret',
      AMAZON_APP_ID: 'amaznAppID',
      AMAZON_APP_SECRET: 'amaznAppID',
    };
  }
  const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, GOOGLE_APP_ID, GOOGLE_APP_SECRET, AMAZON_APP_ID, AMAZON_APP_SECRET }: any = getEnvVars();

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

  if (missingVars.length > 0) {
    throw new Error(`.env file is missing the following key/values: ${missingVars.join(', ')} `);
  }
  return { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, GOOGLE_APP_ID, GOOGLE_APP_SECRET, AMAZON_APP_ID, AMAZON_APP_SECRET };
}
