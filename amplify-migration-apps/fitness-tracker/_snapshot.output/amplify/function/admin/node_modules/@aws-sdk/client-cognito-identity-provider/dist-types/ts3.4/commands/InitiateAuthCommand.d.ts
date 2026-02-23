import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { InitiateAuthRequest, InitiateAuthResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface InitiateAuthCommandInput extends InitiateAuthRequest {}
export interface InitiateAuthCommandOutput
  extends InitiateAuthResponse,
    __MetadataBearer {}
declare const InitiateAuthCommand_base: {
  new (
    input: InitiateAuthCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    InitiateAuthCommandInput,
    InitiateAuthCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: InitiateAuthCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    InitiateAuthCommandInput,
    InitiateAuthCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class InitiateAuthCommand extends InitiateAuthCommand_base {
  protected static __types: {
    api: {
      input: InitiateAuthRequest;
      output: InitiateAuthResponse;
    };
    sdk: {
      input: InitiateAuthCommandInput;
      output: InitiateAuthCommandOutput;
    };
  };
}
