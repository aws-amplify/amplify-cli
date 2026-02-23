import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  StartWebAuthnRegistrationRequest,
  StartWebAuthnRegistrationResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface StartWebAuthnRegistrationCommandInput
  extends StartWebAuthnRegistrationRequest {}
export interface StartWebAuthnRegistrationCommandOutput
  extends StartWebAuthnRegistrationResponse,
    __MetadataBearer {}
declare const StartWebAuthnRegistrationCommand_base: {
  new (
    input: StartWebAuthnRegistrationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    StartWebAuthnRegistrationCommandInput,
    StartWebAuthnRegistrationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: StartWebAuthnRegistrationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    StartWebAuthnRegistrationCommandInput,
    StartWebAuthnRegistrationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class StartWebAuthnRegistrationCommand extends StartWebAuthnRegistrationCommand_base {
  protected static __types: {
    api: {
      input: StartWebAuthnRegistrationRequest;
      output: StartWebAuthnRegistrationResponse;
    };
    sdk: {
      input: StartWebAuthnRegistrationCommandInput;
      output: StartWebAuthnRegistrationCommandOutput;
    };
  };
}
