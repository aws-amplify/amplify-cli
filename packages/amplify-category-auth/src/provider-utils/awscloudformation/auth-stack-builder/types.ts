export type ProviderMeta = {
  ProviderName: string;
  authorize_scopes: string;
  AttributeMapping: { key: string };
};

export type OAuthMetaData = {
  AllowedOAuthFlows?: Array<string>;
  AllowedOAuthFlowsUserPoolClient?: boolean;
  AllowedOAuthScopes?: Array<string>;
  CallbackURLs?: Array<string>;
  LogoutURLs?: Array<string>;
  SupportedIdentityProviders?: Array<string>;
};
