import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminResetUserPasswordRequest,
  AdminResetUserPasswordResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminResetUserPasswordCommandInput
  extends AdminResetUserPasswordRequest {}
export interface AdminResetUserPasswordCommandOutput
  extends AdminResetUserPasswordResponse,
    __MetadataBearer {}
declare const AdminResetUserPasswordCommand_base: {
  new (
    input: AdminResetUserPasswordCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminResetUserPasswordCommandInput,
    AdminResetUserPasswordCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminResetUserPasswordCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminResetUserPasswordCommandInput,
    AdminResetUserPasswordCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminResetUserPasswordCommand extends AdminResetUserPasswordCommand_base {
  protected static __types: {
    api: {
      input: AdminResetUserPasswordRequest;
      output: {};
    };
    sdk: {
      input: AdminResetUserPasswordCommandInput;
      output: AdminResetUserPasswordCommandOutput;
    };
  };
}
