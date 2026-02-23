import type { Paginator } from "@smithy/types";
import { AdminListGroupsForUserCommandInput, AdminListGroupsForUserCommandOutput } from "../commands/AdminListGroupsForUserCommand";
import { CognitoIdentityProviderPaginationConfiguration } from "./Interfaces";
/**
 * @public
 */
export declare const paginateAdminListGroupsForUser: (config: CognitoIdentityProviderPaginationConfiguration, input: AdminListGroupsForUserCommandInput, ...rest: any[]) => Paginator<AdminListGroupsForUserCommandOutput>;
