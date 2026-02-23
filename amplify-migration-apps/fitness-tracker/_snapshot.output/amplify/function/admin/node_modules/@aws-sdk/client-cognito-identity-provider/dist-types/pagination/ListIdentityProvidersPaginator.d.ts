import type { Paginator } from "@smithy/types";
import { ListIdentityProvidersCommandInput, ListIdentityProvidersCommandOutput } from "../commands/ListIdentityProvidersCommand";
import { CognitoIdentityProviderPaginationConfiguration } from "./Interfaces";
/**
 * @public
 */
export declare const paginateListIdentityProviders: (config: CognitoIdentityProviderPaginationConfiguration, input: ListIdentityProvidersCommandInput, ...rest: any[]) => Paginator<ListIdentityProvidersCommandOutput>;
