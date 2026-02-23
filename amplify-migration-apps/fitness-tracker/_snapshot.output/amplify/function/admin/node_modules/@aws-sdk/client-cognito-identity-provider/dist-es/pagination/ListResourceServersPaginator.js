import { createPaginator } from "@smithy/core";
import { CognitoIdentityProviderClient } from "../CognitoIdentityProviderClient";
import { ListResourceServersCommand, } from "../commands/ListResourceServersCommand";
export const paginateListResourceServers = createPaginator(CognitoIdentityProviderClient, ListResourceServersCommand, "NextToken", "NextToken", "MaxResults");
