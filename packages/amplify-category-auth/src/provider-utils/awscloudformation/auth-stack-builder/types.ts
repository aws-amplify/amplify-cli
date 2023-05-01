export interface ProviderMeta {
  ProviderName: string;
  authorize_scopes: string;
  AttributeMapping: { [key: string]: string | undefined };
}

interface ProviderCredsBase {
  ProviderName: string;
  client_id: string;
}

export interface DefaultProviderCreds extends ProviderCredsBase {
  client_secret: string;
}

export interface AppleProviderCreds extends ProviderCredsBase {
  key_id: string;
  private_key: string;
  team_id: string;
}

export type ProviderCreds = DefaultProviderCreds | AppleProviderCreds;

export interface FacebookProviderParameters {
  facebookAuthorizeScopes?: string;
  facebookAppIdUserPool?: string;
  facebookAppSecretUserPool?: string;
}

export interface GoogleProviderParameters {
  googleAuthorizeScopes?: string;
  googleAppIdUserPool?: string;
  googleAppSecretUserPool?: string;
}

export interface LoginWitAmazonProviderParameters {
  loginwithamazonAuthorizeScopes?: string;
  loginwithamazonAppIdUserPool?: string;
  loginwithamazonAppSecretUserPool?: string;
}

export interface SignInWithAppleProviderParameters {
  signinwithappleAuthorizeScopes?: string;
  signinwithappleClientIdUserPool?: string;
  signinwithappleKeyIdUserPool?: string;
  signinwithapplePrivateKeyUserPool?: string;
  signinwithappleTeamIdUserPool?: string;
}

export type ProviderParameters = FacebookProviderParameters &
  GoogleProviderParameters &
  LoginWitAmazonProviderParameters &
  SignInWithAppleProviderParameters;

export type OAuthMetaData = {
  AllowedOAuthFlows?: Array<string>;
  AllowedOAuthFlowsUserPoolClient?: boolean;
  AllowedOAuthScopes?: Array<string>;
  CallbackURLs?: Array<string>;
  LogoutURLs?: Array<string>;
  SupportedIdentityProviders?: Array<string>;
};
