import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminEnableUserRequest,
  AdminEnableUserResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminEnableUserCommandInput extends AdminEnableUserRequest {}
export interface AdminEnableUserCommandOutput
  extends AdminEnableUserResponse,
    __MetadataBearer {}
declare const AdminEnableUserCommand_base: {
  new (
    input: AdminEnableUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminEnableUserCommandInput,
    AdminEnableUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminEnableUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminEnableUserCommandInput,
    AdminEnableUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminEnableUserCommand extends AdminEnableUserCommand_base {
  protected static __types: {
    api: {
      input: AdminEnableUserRequest;
      output: {};
    };
    sdk: {
      input: AdminEnableUserCommandInput;
      output: AdminEnableUserCommandOutput;
    };
  };
}
