export type OAuthMetaData = {
  AllowedOAuthFlows?: Array<string>;
  AllowedOAuthFlowsUserPoolClient?: boolean;
  AllowedOAuthScopes?: Array<string>;
  CallbackURLs?: Array<string>;
  LogoutURLs?: Array<string>;
  SupportedIdentityProviders?: Array<string>;
};
