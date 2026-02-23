import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  UpdateUserPoolClientRequest,
  UpdateUserPoolClientResponse,
} from "../models/models_1";
export { __MetadataBearer };
export { $Command };
export interface UpdateUserPoolClientCommandInput
  extends UpdateUserPoolClientRequest {}
export interface UpdateUserPoolClientCommandOutput
  extends UpdateUserPoolClientResponse,
    __MetadataBearer {}
declare const UpdateUserPoolClientCommand_base: {
  new (
    input: UpdateUserPoolClientCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateUserPoolClientCommandInput,
    UpdateUserPoolClientCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: UpdateUserPoolClientCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateUserPoolClientCommandInput,
    UpdateUserPoolClientCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class UpdateUserPoolClientCommand extends UpdateUserPoolClientCommand_base {
  protected static __types: {
    api: {
      input: UpdateUserPoolClientRequest;
      output: UpdateUserPoolClientResponse;
    };
    sdk: {
      input: UpdateUserPoolClientCommandInput;
      output: UpdateUserPoolClientCommandOutput;
    };
  };
}
