import type { Paginator } from "@smithy/types";
import { AdminListUserAuthEventsCommandInput, AdminListUserAuthEventsCommandOutput } from "../commands/AdminListUserAuthEventsCommand";
import { CognitoIdentityProviderPaginationConfiguration } from "./Interfaces";
/**
 * @public
 */
export declare const paginateAdminListUserAuthEvents: (config: CognitoIdentityProviderPaginationConfiguration, input: AdminListUserAuthEventsCommandInput, ...rest: any[]) => Paginator<AdminListUserAuthEventsCommandOutput>;
