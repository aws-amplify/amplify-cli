import type { Paginator } from "@smithy/types";
import { ListUsersInGroupCommandInput, ListUsersInGroupCommandOutput } from "../commands/ListUsersInGroupCommand";
import { CognitoIdentityProviderPaginationConfiguration } from "./Interfaces";
/**
 * @public
 */
export declare const paginateListUsersInGroup: (config: CognitoIdentityProviderPaginationConfiguration, input: ListUsersInGroupCommandInput, ...rest: any[]) => Paginator<ListUsersInGroupCommandOutput>;
