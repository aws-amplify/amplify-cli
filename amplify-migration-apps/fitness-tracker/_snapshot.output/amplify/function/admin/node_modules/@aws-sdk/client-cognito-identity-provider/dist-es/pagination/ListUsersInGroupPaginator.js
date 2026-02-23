import { createPaginator } from "@smithy/core";
import { CognitoIdentityProviderClient } from "../CognitoIdentityProviderClient";
import { ListUsersInGroupCommand, } from "../commands/ListUsersInGroupCommand";
export const paginateListUsersInGroup = createPaginator(CognitoIdentityProviderClient, ListUsersInGroupCommand, "NextToken", "NextToken", "Limit");
