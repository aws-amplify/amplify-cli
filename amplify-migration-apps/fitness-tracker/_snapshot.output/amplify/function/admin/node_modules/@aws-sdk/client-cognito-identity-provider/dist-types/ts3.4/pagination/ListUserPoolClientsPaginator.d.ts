import { Paginator } from "@smithy/types";
import {
  ListUserPoolClientsCommandInput,
  ListUserPoolClientsCommandOutput,
} from "../commands/ListUserPoolClientsCommand";
import { CognitoIdentityProviderPaginationConfiguration } from "./Interfaces";
export declare const paginateListUserPoolClients: (
  config: CognitoIdentityProviderPaginationConfiguration,
  input: ListUserPoolClientsCommandInput,
  ...rest: any[]
) => Paginator<ListUserPoolClientsCommandOutput>;
