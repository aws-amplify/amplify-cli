import { createPaginator } from "@smithy/core";
import { CognitoIdentityProviderClient } from "../CognitoIdentityProviderClient";
import { ListUsersCommand } from "../commands/ListUsersCommand";
export const paginateListUsers = createPaginator(CognitoIdentityProviderClient, ListUsersCommand, "PaginationToken", "PaginationToken", "Limit");
