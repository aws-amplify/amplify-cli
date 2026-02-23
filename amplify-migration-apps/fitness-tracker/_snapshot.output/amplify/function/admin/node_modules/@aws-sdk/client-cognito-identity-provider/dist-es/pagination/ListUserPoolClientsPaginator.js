import { createPaginator } from "@smithy/core";
import { CognitoIdentityProviderClient } from "../CognitoIdentityProviderClient";
import { ListUserPoolClientsCommand, } from "../commands/ListUserPoolClientsCommand";
export const paginateListUserPoolClients = createPaginator(CognitoIdentityProviderClient, ListUserPoolClientsCommand, "NextToken", "NextToken", "MaxResults");
