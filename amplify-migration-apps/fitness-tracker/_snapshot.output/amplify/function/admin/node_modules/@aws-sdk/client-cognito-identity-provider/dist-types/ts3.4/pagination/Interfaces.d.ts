import { PaginationConfiguration } from "@smithy/types";
import { CognitoIdentityProviderClient } from "../CognitoIdentityProviderClient";
export interface CognitoIdentityProviderPaginationConfiguration
  extends PaginationConfiguration {
  client: CognitoIdentityProviderClient;
}
