import { createPaginator } from "@smithy/core";
import { CognitoIdentityProviderClient } from "../CognitoIdentityProviderClient";
import { ListIdentityProvidersCommand, } from "../commands/ListIdentityProvidersCommand";
export const paginateListIdentityProviders = createPaginator(CognitoIdentityProviderClient, ListIdentityProvidersCommand, "NextToken", "NextToken", "MaxResults");
