import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { ListGroupsRequest, ListGroupsResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ListGroupsCommandInput extends ListGroupsRequest {}
export interface ListGroupsCommandOutput
  extends ListGroupsResponse,
    __MetadataBearer {}
declare const ListGroupsCommand_base: {
  new (
    input: ListGroupsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListGroupsCommandInput,
    ListGroupsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ListGroupsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListGroupsCommandInput,
    ListGroupsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ListGroupsCommand extends ListGroupsCommand_base {
  protected static __types: {
    api: {
      input: ListGroupsRequest;
      output: ListGroupsResponse;
    };
    sdk: {
      input: ListGroupsCommandInput;
      output: ListGroupsCommandOutput;
    };
  };
}
