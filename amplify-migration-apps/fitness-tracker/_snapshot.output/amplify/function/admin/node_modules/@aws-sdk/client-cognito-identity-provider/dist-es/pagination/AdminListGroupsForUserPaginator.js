import { createPaginator } from "@smithy/core";
import { CognitoIdentityProviderClient } from "../CognitoIdentityProviderClient";
import { AdminListGroupsForUserCommand, } from "../commands/AdminListGroupsForUserCommand";
export const paginateAdminListGroupsForUser = createPaginator(CognitoIdentityProviderClient, AdminListGroupsForUserCommand, "NextToken", "NextToken", "Limit");
