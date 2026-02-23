import { Paginator } from "@smithy/types";
import {
  ListResourceServersCommandInput,
  ListResourceServersCommandOutput,
} from "../commands/ListResourceServersCommand";
import { CognitoIdentityProviderPaginationConfiguration } from "./Interfaces";
export declare const paginateListResourceServers: (
  config: CognitoIdentityProviderPaginationConfiguration,
  input: ListResourceServersCommandInput,
  ...rest: any[]
) => Paginator<ListResourceServersCommandOutput>;
