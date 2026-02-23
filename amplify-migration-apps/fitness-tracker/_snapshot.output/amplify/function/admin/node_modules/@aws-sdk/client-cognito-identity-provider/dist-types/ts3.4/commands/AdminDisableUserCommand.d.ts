import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminDisableUserRequest,
  AdminDisableUserResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminDisableUserCommandInput extends AdminDisableUserRequest {}
export interface AdminDisableUserCommandOutput
  extends AdminDisableUserResponse,
    __MetadataBearer {}
declare const AdminDisableUserCommand_base: {
  new (
    input: AdminDisableUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminDisableUserCommandInput,
    AdminDisableUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminDisableUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminDisableUserCommandInput,
    AdminDisableUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminDisableUserCommand extends AdminDisableUserCommand_base {
  protected static __types: {
    api: {
      input: AdminDisableUserRequest;
      output: {};
    };
    sdk: {
      input: AdminDisableUserCommandInput;
      output: AdminDisableUserCommandOutput;
    };
  };
}
