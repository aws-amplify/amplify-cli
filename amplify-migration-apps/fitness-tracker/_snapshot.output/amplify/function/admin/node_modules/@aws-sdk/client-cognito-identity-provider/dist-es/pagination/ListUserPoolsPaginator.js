import { createPaginator } from "@smithy/core";
import { CognitoIdentityProviderClient } from "../CognitoIdentityProviderClient";
import { ListUserPoolsCommand, } from "../commands/ListUserPoolsCommand";
export const paginateListUserPools = createPaginator(CognitoIdentityProviderClient, ListUserPoolsCommand, "NextToken", "NextToken", "MaxResults");
