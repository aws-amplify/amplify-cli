"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocialProviders = exports.getEnvVars = void 0;
function getEnvVars() {
    return Object.assign({}, process.env);
}
exports.getEnvVars = getEnvVars;
function getSocialProviders(getEnv = false) {
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
            // Cognito validates the private key, this is an invalidated key.
            APPLE_PRIVATE_KEY: '----BEGIN PRIVATE KEY-----MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgIltgNsTgTfSzUadYiCS0VYtDDMFln/J8i1yJsSIw5g+gCgYIKoZIzj0DAQehRANCAASI8E0L/DhR/mIfTT07v3VwQu6q8I76lgn7kFhT0HvWoLuHKGQFcFkXXCgztgBrprzd419mUChAnKE6y89bWcNw----END PRIVATE KEY----',
        };
    }
    const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, GOOGLE_APP_ID, GOOGLE_APP_SECRET, AMAZON_APP_ID, AMAZON_APP_SECRET, APPLE_APP_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY_2, } = getEnvVars();
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
    if (!APPLE_PRIVATE_KEY_2) {
        missingVars.push('APPLE_PRIVATE_KEY');
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
        APPLE_PRIVATE_KEY: APPLE_PRIVATE_KEY_2,
    };
}
exports.getSocialProviders = getSocialProviders;
//# sourceMappingURL=envVars.js.map