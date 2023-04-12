import { addAuthUserPoolOnlyWithOAuth, amplifyPushAuth, AddAuthUserPoolOnlyWithOAuthSettings } from '@aws-amplify/amplify-e2e-core';
import { v4 as uuid } from 'uuid';

/**
 * sets up a project with auth (UserPool only or UserPool & IdentityPool)
 */
export const setupOgProjectWithAuth = async (ogProjectRoot: string, ogProjectSettings: { name: string }): Promise<void> => {
  const ogShortId = getShortId();
  await addAuthUserPoolOnlyWithOAuth(ogProjectRoot, createUserPoolWithOAuthSettings(ogProjectSettings.name, ogShortId));
  await amplifyPushAuth(ogProjectRoot);
};

const createUserPoolWithOAuthSettings = (projectPrefix: string, shortId: string): AddAuthUserPoolOnlyWithOAuthSettings => {
  return {
    resourceName: `${projectPrefix}oares${shortId}`,
    userPoolName: `${projectPrefix}oaup${shortId}`,
    domainPrefix: `${projectPrefix}oadom${shortId}`,
    signInUrl1: 'https://sin1/',
    signInUrl2: 'https://sin2/',
    signOutUrl1: 'https://sout1/',
    signOutUrl2: 'https://sout2/',
    facebookAppId: 'facebookAppId',
    facebookAppSecret: 'facebookAppSecret',
    googleAppId: 'googleAppId',
    googleAppSecret: 'googleAppSecret',
    amazonAppId: 'amazonAppId',
    amazonAppSecret: 'amazonAppSecret',
    appleAppClientId: 'com.fake.app',
    appleAppTeamId: '2QLEWNDK6K',
    appleAppKeyID: '2QLZXKYJ8J',
    appleAppPrivateKey:
      '----BEGIN PRIVATE KEY----MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgIltgNsTgTfSzUadYiCS0VYtDDMFln/J8i1yJsSIw5g+gCgYIKoZIzj0DAQehRANCAASI8E0L/DhR/mIfTT07v3VwQu6q8I76lgn7kFhT0HvWoLuHKGQFcFkXXCgztgBrprzd419mUChAnKE6y89bWcNw----END PRIVATE KEY----',
  };
};

/**
 *  generates a uuid
 */

export const getShortId = (): string => {
  const [shortId] = uuid().split('-');

  return shortId;
};
