import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminSetUserPasswordRequest,
  AdminSetUserPasswordResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminSetUserPasswordCommandInput
  extends AdminSetUserPasswordRequest {}
export interface AdminSetUserPasswordCommandOutput
  extends AdminSetUserPasswordResponse,
    __MetadataBearer {}
declare const AdminSetUserPasswordCommand_base: {
  new (
    input: AdminSetUserPasswordCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminSetUserPasswordCommandInput,
    AdminSetUserPasswordCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminSetUserPasswordCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminSetUserPasswordCommandInput,
    AdminSetUserPasswordCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminSetUserPasswordCommand extends AdminSetUserPasswordCommand_base {
  protected static __types: {
    api: {
      input: AdminSetUserPasswordRequest;
      output: {};
    };
    sdk: {
      input: AdminSetUserPasswordCommandInput;
      output: AdminSetUserPasswordCommandOutput;
    };
  };
}
