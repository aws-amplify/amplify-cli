import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  GetUserPoolMfaConfigRequest,
  GetUserPoolMfaConfigResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetUserPoolMfaConfigCommandInput
  extends GetUserPoolMfaConfigRequest {}
export interface GetUserPoolMfaConfigCommandOutput
  extends GetUserPoolMfaConfigResponse,
    __MetadataBearer {}
declare const GetUserPoolMfaConfigCommand_base: {
  new (
    input: GetUserPoolMfaConfigCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetUserPoolMfaConfigCommandInput,
    GetUserPoolMfaConfigCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GetUserPoolMfaConfigCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetUserPoolMfaConfigCommandInput,
    GetUserPoolMfaConfigCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class GetUserPoolMfaConfigCommand extends GetUserPoolMfaConfigCommand_base {
  protected static __types: {
    api: {
      input: GetUserPoolMfaConfigRequest;
      output: GetUserPoolMfaConfigResponse;
    };
    sdk: {
      input: GetUserPoolMfaConfigCommandInput;
      output: GetUserPoolMfaConfigCommandOutput;
    };
  };
}
