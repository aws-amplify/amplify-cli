export interface ProviderMeta {
  ProviderName: string;
  authorize_scopes: string;
  AttributeMapping: { [key: string]: string | undefined };
}

export interface ProviderCreds {
  ProviderName: string;
  client_id: string;
  client_secret?: string;
  team_id?: string;
  key_id?: string;
  private_key?: string;
}

export type OAuthMetaData = {
  AllowedOAuthFlows?: Array<string>;
  AllowedOAuthFlowsUserPoolClient?: boolean;
  AllowedOAuthScopes?: Array<string>;
  CallbackURLs?: Array<string>;
  LogoutURLs?: Array<string>;
  SupportedIdentityProviders?: Array<string>;
};
