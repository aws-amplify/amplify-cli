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
export declare function getEnvVars(): EnvironmentVariables;
export declare function getSocialProviders(getEnv?: boolean): SocialProviders;
export {};
