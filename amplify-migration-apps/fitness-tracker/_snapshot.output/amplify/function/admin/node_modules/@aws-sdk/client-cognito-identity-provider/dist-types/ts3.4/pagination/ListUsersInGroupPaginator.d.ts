import { Paginator } from "@smithy/types";
import {
  ListUsersInGroupCommandInput,
  ListUsersInGroupCommandOutput,
} from "../commands/ListUsersInGroupCommand";
import { CognitoIdentityProviderPaginationConfiguration } from "./Interfaces";
export declare const paginateListUsersInGroup: (
  config: CognitoIdentityProviderPaginationConfiguration,
  input: ListUsersInGroupCommandInput,
  ...rest: any[]
) => Paginator<ListUsersInGroupCommandOutput>;
