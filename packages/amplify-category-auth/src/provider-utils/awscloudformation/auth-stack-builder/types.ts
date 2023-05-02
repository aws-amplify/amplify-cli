export interface ProviderMeta {
  ProviderName: string;
  authorize_scopes: string;
  AttributeMapping: { [key: string]: string | undefined };
}

export type OAuthMetaData = {
  AllowedOAuthFlows?: Array<string>;
  AllowedOAuthFlowsUserPoolClient?: boolean;
  AllowedOAuthScopes?: Array<string>;
  CallbackURLs?: Array<string>;
  LogoutURLs?: Array<string>;
  SupportedIdentityProviders?: Array<string>;
};
