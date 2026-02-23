import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ForgotPasswordCommandInput extends ForgotPasswordRequest {}
export interface ForgotPasswordCommandOutput
  extends ForgotPasswordResponse,
    __MetadataBearer {}
declare const ForgotPasswordCommand_base: {
  new (
    input: ForgotPasswordCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ForgotPasswordCommandInput,
    ForgotPasswordCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ForgotPasswordCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ForgotPasswordCommandInput,
    ForgotPasswordCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ForgotPasswordCommand extends ForgotPasswordCommand_base {
  protected static __types: {
    api: {
      input: ForgotPasswordRequest;
      output: ForgotPasswordResponse;
    };
    sdk: {
      input: ForgotPasswordCommandInput;
      output: ForgotPasswordCommandOutput;
    };
  };
}
