import type { Paginator } from "@smithy/types";
import { ListGroupsCommandInput, ListGroupsCommandOutput } from "../commands/ListGroupsCommand";
import { CognitoIdentityProviderPaginationConfiguration } from "./Interfaces";
/**
 * @public
 */
export declare const paginateListGroups: (config: CognitoIdentityProviderPaginationConfiguration, input: ListGroupsCommandInput, ...rest: any[]) => Paginator<ListGroupsCommandOutput>;
