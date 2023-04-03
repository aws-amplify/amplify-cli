export interface AddApiRequest {
    version: 1;
    serviceConfiguration: AppSyncServiceConfiguration;
}
export interface AppSyncServiceConfiguration {
    serviceName: 'AppSync';
    apiName: string;
    transformSchema: string;
    defaultAuthType: AppSyncAuthType;
    additionalAuthTypes?: AppSyncAuthType[];
    conflictResolution?: ConflictResolution;
    apiKeyExpiration?: AppSyncAPIKeyExpiration;
}
export interface ConflictResolution {
    defaultResolutionStrategy?: ResolutionStrategy;
    perModelResolutionStrategy?: PerModelResolutionstrategy[];
}
export interface PerModelResolutionstrategy {
    resolutionStrategy: ResolutionStrategy;
    entityName: string;
}
export interface PredefinedResolutionStrategy {
    type: 'OPTIMISTIC_CONCURRENCY' | 'AUTOMERGE' | 'NONE';
}
export interface LambdaResolutionStrategy {
    type: 'LAMBDA';
    resolver: LambdaConflictResolver;
}
export type LambdaConflictResolver = NewLambdaConflictResolver | ExistingLambdaConflictResolver;
export interface NewLambdaConflictResolver {
    type: 'NEW';
}
export interface ExistingLambdaConflictResolver {
    type: 'EXISTING';
    name: string;
    region?: string;
    arn?: string;
}
export type ResolutionStrategy = PredefinedResolutionStrategy | LambdaResolutionStrategy;
export type AppSyncAuthType = AppSyncAPIKeyAuthType | AppSyncAWSIAMAuthType | AppSyncCognitoUserPoolsAuthType | AppSyncOpenIDConnectAuthType | AppSyncLambdaAuthType;
export interface AppSyncAPIKeyAuthType {
    mode: 'API_KEY';
    expirationTime?: number;
    apiKeyExpirationDate?: Date;
    keyDescription?: string;
}
export interface AppSyncAPIKeyExpiration {
    days: number;
}
export interface AppSyncAWSIAMAuthType {
    mode: 'AWS_IAM';
}
export interface AppSyncCognitoUserPoolsAuthType {
    mode: 'AMAZON_COGNITO_USER_POOLS';
    cognitoUserPoolId?: string;
}
export interface AppSyncOpenIDConnectAuthType {
    mode: 'OPENID_CONNECT';
    openIDProviderName: string;
    openIDIssuerURL: string;
    openIDClientID: string;
    openIDAuthTTL?: string;
    openIDIatTTL?: string;
}
export interface AppSyncLambdaAuthType {
    mode: 'AWS_LAMBDA';
    lambdaFunction: string;
    ttlSeconds?: string;
}
//# sourceMappingURL=add.d.ts.map