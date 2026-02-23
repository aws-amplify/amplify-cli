import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  ConfirmSignUpRequest,
  ConfirmSignUpResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ConfirmSignUpCommandInput extends ConfirmSignUpRequest {}
export interface ConfirmSignUpCommandOutput
  extends ConfirmSignUpResponse,
    __MetadataBearer {}
declare const ConfirmSignUpCommand_base: {
  new (
    input: ConfirmSignUpCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ConfirmSignUpCommandInput,
    ConfirmSignUpCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ConfirmSignUpCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ConfirmSignUpCommandInput,
    ConfirmSignUpCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ConfirmSignUpCommand extends ConfirmSignUpCommand_base {
  protected static __types: {
    api: {
      input: ConfirmSignUpRequest;
      output: ConfirmSignUpResponse;
    };
    sdk: {
      input: ConfirmSignUpCommandInput;
      output: ConfirmSignUpCommandOutput;
    };
  };
}
