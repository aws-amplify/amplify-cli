import type { Paginator } from "@smithy/types";
import { ListUserPoolClientsCommandInput, ListUserPoolClientsCommandOutput } from "../commands/ListUserPoolClientsCommand";
import { CognitoIdentityProviderPaginationConfiguration } from "./Interfaces";
/**
 * @public
 */
export declare const paginateListUserPoolClients: (config: CognitoIdentityProviderPaginationConfiguration, input: ListUserPoolClientsCommandInput, ...rest: any[]) => Paginator<ListUserPoolClientsCommandOutput>;
