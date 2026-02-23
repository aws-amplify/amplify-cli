import type { Paginator } from "@smithy/types";
import { ListUserPoolsCommandInput, ListUserPoolsCommandOutput } from "../commands/ListUserPoolsCommand";
import { CognitoIdentityProviderPaginationConfiguration } from "./Interfaces";
/**
 * @public
 */
export declare const paginateListUserPools: (config: CognitoIdentityProviderPaginationConfiguration, input: ListUserPoolsCommandInput, ...rest: any[]) => Paginator<ListUserPoolsCommandOutput>;
