import type { Paginator } from "@smithy/types";
import { ListUsersCommandInput, ListUsersCommandOutput } from "../commands/ListUsersCommand";
import { CognitoIdentityProviderPaginationConfiguration } from "./Interfaces";
/**
 * @public
 */
export declare const paginateListUsers: (config: CognitoIdentityProviderPaginationConfiguration, input: ListUsersCommandInput, ...rest: any[]) => Paginator<ListUsersCommandOutput>;
