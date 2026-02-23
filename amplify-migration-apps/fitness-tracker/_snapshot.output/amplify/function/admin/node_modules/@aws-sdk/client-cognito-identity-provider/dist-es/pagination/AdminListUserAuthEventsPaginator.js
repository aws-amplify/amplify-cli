import { createPaginator } from "@smithy/core";
import { CognitoIdentityProviderClient } from "../CognitoIdentityProviderClient";
import { AdminListUserAuthEventsCommand, } from "../commands/AdminListUserAuthEventsCommand";
export const paginateAdminListUserAuthEvents = createPaginator(CognitoIdentityProviderClient, AdminListUserAuthEventsCommand, "NextToken", "NextToken", "MaxResults");
