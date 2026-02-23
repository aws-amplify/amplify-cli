import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { RevokeTokenRequest, RevokeTokenResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface RevokeTokenCommandInput extends RevokeTokenRequest {}
export interface RevokeTokenCommandOutput
  extends RevokeTokenResponse,
    __MetadataBearer {}
declare const RevokeTokenCommand_base: {
  new (
    input: RevokeTokenCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    RevokeTokenCommandInput,
    RevokeTokenCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: RevokeTokenCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    RevokeTokenCommandInput,
    RevokeTokenCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class RevokeTokenCommand extends RevokeTokenCommand_base {
  protected static __types: {
    api: {
      input: RevokeTokenRequest;
      output: {};
    };
    sdk: {
      input: RevokeTokenCommandInput;
      output: RevokeTokenCommandOutput;
    };
  };
}
