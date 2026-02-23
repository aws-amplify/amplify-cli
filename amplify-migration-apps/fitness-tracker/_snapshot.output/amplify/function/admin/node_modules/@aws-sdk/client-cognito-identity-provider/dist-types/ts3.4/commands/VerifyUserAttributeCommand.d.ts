import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  VerifyUserAttributeRequest,
  VerifyUserAttributeResponse,
} from "../models/models_1";
export { __MetadataBearer };
export { $Command };
export interface VerifyUserAttributeCommandInput
  extends VerifyUserAttributeRequest {}
export interface VerifyUserAttributeCommandOutput
  extends VerifyUserAttributeResponse,
    __MetadataBearer {}
declare const VerifyUserAttributeCommand_base: {
  new (
    input: VerifyUserAttributeCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    VerifyUserAttributeCommandInput,
    VerifyUserAttributeCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: VerifyUserAttributeCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    VerifyUserAttributeCommandInput,
    VerifyUserAttributeCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class VerifyUserAttributeCommand extends VerifyUserAttributeCommand_base {
  protected static __types: {
    api: {
      input: VerifyUserAttributeRequest;
      output: {};
    };
    sdk: {
      input: VerifyUserAttributeCommandInput;
      output: VerifyUserAttributeCommandOutput;
    };
  };
}
