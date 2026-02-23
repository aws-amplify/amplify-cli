import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  VerifySoftwareTokenRequest,
  VerifySoftwareTokenResponse,
} from "../models/models_1";
export { __MetadataBearer };
export { $Command };
export interface VerifySoftwareTokenCommandInput
  extends VerifySoftwareTokenRequest {}
export interface VerifySoftwareTokenCommandOutput
  extends VerifySoftwareTokenResponse,
    __MetadataBearer {}
declare const VerifySoftwareTokenCommand_base: {
  new (
    input: VerifySoftwareTokenCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    VerifySoftwareTokenCommandInput,
    VerifySoftwareTokenCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: VerifySoftwareTokenCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    VerifySoftwareTokenCommandInput,
    VerifySoftwareTokenCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class VerifySoftwareTokenCommand extends VerifySoftwareTokenCommand_base {
  protected static __types: {
    api: {
      input: VerifySoftwareTokenRequest;
      output: VerifySoftwareTokenResponse;
    };
    sdk: {
      input: VerifySoftwareTokenCommandInput;
      output: VerifySoftwareTokenCommandOutput;
    };
  };
}
