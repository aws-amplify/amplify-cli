import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminInitiateAuthRequest,
  AdminInitiateAuthResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminInitiateAuthCommandInput
  extends AdminInitiateAuthRequest {}
export interface AdminInitiateAuthCommandOutput
  extends AdminInitiateAuthResponse,
    __MetadataBearer {}
declare const AdminInitiateAuthCommand_base: {
  new (
    input: AdminInitiateAuthCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminInitiateAuthCommandInput,
    AdminInitiateAuthCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminInitiateAuthCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminInitiateAuthCommandInput,
    AdminInitiateAuthCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminInitiateAuthCommand extends AdminInitiateAuthCommand_base {
  protected static __types: {
    api: {
      input: AdminInitiateAuthRequest;
      output: AdminInitiateAuthResponse;
    };
    sdk: {
      input: AdminInitiateAuthCommandInput;
      output: AdminInitiateAuthCommandOutput;
    };
  };
}
