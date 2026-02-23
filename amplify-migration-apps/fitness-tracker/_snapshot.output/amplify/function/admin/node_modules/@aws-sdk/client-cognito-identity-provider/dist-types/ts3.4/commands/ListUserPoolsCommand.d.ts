import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  ListUserPoolsRequest,
  ListUserPoolsResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ListUserPoolsCommandInput extends ListUserPoolsRequest {}
export interface ListUserPoolsCommandOutput
  extends ListUserPoolsResponse,
    __MetadataBearer {}
declare const ListUserPoolsCommand_base: {
  new (
    input: ListUserPoolsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListUserPoolsCommandInput,
    ListUserPoolsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ListUserPoolsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListUserPoolsCommandInput,
    ListUserPoolsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ListUserPoolsCommand extends ListUserPoolsCommand_base {
  protected static __types: {
    api: {
      input: ListUserPoolsRequest;
      output: ListUserPoolsResponse;
    };
    sdk: {
      input: ListUserPoolsCommandInput;
      output: ListUserPoolsCommandOutput;
    };
  };
}
