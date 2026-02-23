import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { SignUpRequest, SignUpResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface SignUpCommandInput extends SignUpRequest {}
export interface SignUpCommandOutput extends SignUpResponse, __MetadataBearer {}
declare const SignUpCommand_base: {
  new (input: SignUpCommandInput): import("@smithy/smithy-client").CommandImpl<
    SignUpCommandInput,
    SignUpCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (input: SignUpCommandInput): import("@smithy/smithy-client").CommandImpl<
    SignUpCommandInput,
    SignUpCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class SignUpCommand extends SignUpCommand_base {
  protected static __types: {
    api: {
      input: SignUpRequest;
      output: SignUpResponse;
    };
    sdk: {
      input: SignUpCommandInput;
      output: SignUpCommandOutput;
    };
  };
}
