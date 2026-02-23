import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  ConfirmForgotPasswordRequest,
  ConfirmForgotPasswordResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ConfirmForgotPasswordCommandInput
  extends ConfirmForgotPasswordRequest {}
export interface ConfirmForgotPasswordCommandOutput
  extends ConfirmForgotPasswordResponse,
    __MetadataBearer {}
declare const ConfirmForgotPasswordCommand_base: {
  new (
    input: ConfirmForgotPasswordCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ConfirmForgotPasswordCommandInput,
    ConfirmForgotPasswordCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ConfirmForgotPasswordCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ConfirmForgotPasswordCommandInput,
    ConfirmForgotPasswordCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ConfirmForgotPasswordCommand extends ConfirmForgotPasswordCommand_base {
  protected static __types: {
    api: {
      input: ConfirmForgotPasswordRequest;
      output: {};
    };
    sdk: {
      input: ConfirmForgotPasswordCommandInput;
      output: ConfirmForgotPasswordCommandOutput;
    };
  };
}
