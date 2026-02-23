import { Paginator } from "@smithy/types";
import {
  ListGroupsCommandInput,
  ListGroupsCommandOutput,
} from "../commands/ListGroupsCommand";
import { CognitoIdentityProviderPaginationConfiguration } from "./Interfaces";
export declare const paginateListGroups: (
  config: CognitoIdentityProviderPaginationConfiguration,
  input: ListGroupsCommandInput,
  ...rest: any[]
) => Paginator<ListGroupsCommandOutput>;
