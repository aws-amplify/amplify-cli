import { createPaginator } from "@smithy/core";
import { CognitoIdentityProviderClient } from "../CognitoIdentityProviderClient";
import { ListGroupsCommand } from "../commands/ListGroupsCommand";
export const paginateListGroups = createPaginator(CognitoIdentityProviderClient, ListGroupsCommand, "NextToken", "NextToken", "Limit");
