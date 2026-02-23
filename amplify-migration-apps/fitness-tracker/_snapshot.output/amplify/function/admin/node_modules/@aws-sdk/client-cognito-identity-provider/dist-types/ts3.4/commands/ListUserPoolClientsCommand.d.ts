import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  ListUserPoolClientsRequest,
  ListUserPoolClientsResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ListUserPoolClientsCommandInput
  extends ListUserPoolClientsRequest {}
export interface ListUserPoolClientsCommandOutput
  extends ListUserPoolClientsResponse,
    __MetadataBearer {}
declare const ListUserPoolClientsCommand_base: {
  new (
    input: ListUserPoolClientsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListUserPoolClientsCommandInput,
    ListUserPoolClientsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ListUserPoolClientsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListUserPoolClientsCommandInput,
    ListUserPoolClientsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ListUserPoolClientsCommand extends ListUserPoolClientsCommand_base {
  protected static __types: {
    api: {
      input: ListUserPoolClientsRequest;
      output: ListUserPoolClientsResponse;
    };
    sdk: {
      input: ListUserPoolClientsCommandInput;
      output: ListUserPoolClientsCommandOutput;
    };
  };
}
