import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  CompleteWebAuthnRegistrationRequest,
  CompleteWebAuthnRegistrationResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface CompleteWebAuthnRegistrationCommandInput
  extends CompleteWebAuthnRegistrationRequest {}
export interface CompleteWebAuthnRegistrationCommandOutput
  extends CompleteWebAuthnRegistrationResponse,
    __MetadataBearer {}
declare const CompleteWebAuthnRegistrationCommand_base: {
  new (
    input: CompleteWebAuthnRegistrationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CompleteWebAuthnRegistrationCommandInput,
    CompleteWebAuthnRegistrationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: CompleteWebAuthnRegistrationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CompleteWebAuthnRegistrationCommandInput,
    CompleteWebAuthnRegistrationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class CompleteWebAuthnRegistrationCommand extends CompleteWebAuthnRegistrationCommand_base {
  protected static __types: {
    api: {
      input: CompleteWebAuthnRegistrationRequest;
      output: {};
    };
    sdk: {
      input: CompleteWebAuthnRegistrationCommandInput;
      output: CompleteWebAuthnRegistrationCommandOutput;
    };
  };
}
