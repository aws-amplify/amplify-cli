import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  SetUserPoolMfaConfigRequest,
  SetUserPoolMfaConfigResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface SetUserPoolMfaConfigCommandInput
  extends SetUserPoolMfaConfigRequest {}
export interface SetUserPoolMfaConfigCommandOutput
  extends SetUserPoolMfaConfigResponse,
    __MetadataBearer {}
declare const SetUserPoolMfaConfigCommand_base: {
  new (
    input: SetUserPoolMfaConfigCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    SetUserPoolMfaConfigCommandInput,
    SetUserPoolMfaConfigCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: SetUserPoolMfaConfigCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    SetUserPoolMfaConfigCommandInput,
    SetUserPoolMfaConfigCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class SetUserPoolMfaConfigCommand extends SetUserPoolMfaConfigCommand_base {
  protected static __types: {
    api: {
      input: SetUserPoolMfaConfigRequest;
      output: SetUserPoolMfaConfigResponse;
    };
    sdk: {
      input: SetUserPoolMfaConfigCommandInput;
      output: SetUserPoolMfaConfigCommandOutput;
    };
  };
}
