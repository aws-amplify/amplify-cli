import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  UpdateUserPoolRequest,
  UpdateUserPoolResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface UpdateUserPoolCommandInput extends UpdateUserPoolRequest {}
export interface UpdateUserPoolCommandOutput
  extends UpdateUserPoolResponse,
    __MetadataBearer {}
declare const UpdateUserPoolCommand_base: {
  new (
    input: UpdateUserPoolCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateUserPoolCommandInput,
    UpdateUserPoolCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: UpdateUserPoolCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateUserPoolCommandInput,
    UpdateUserPoolCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class UpdateUserPoolCommand extends UpdateUserPoolCommand_base {
  protected static __types: {
    api: {
      input: UpdateUserPoolRequest;
      output: {};
    };
    sdk: {
      input: UpdateUserPoolCommandInput;
      output: UpdateUserPoolCommandOutput;
    };
  };
}
