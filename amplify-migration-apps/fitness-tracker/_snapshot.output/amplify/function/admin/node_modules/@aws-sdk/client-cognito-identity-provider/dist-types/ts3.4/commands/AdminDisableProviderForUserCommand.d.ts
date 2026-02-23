import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminDisableProviderForUserRequest,
  AdminDisableProviderForUserResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminDisableProviderForUserCommandInput
  extends AdminDisableProviderForUserRequest {}
export interface AdminDisableProviderForUserCommandOutput
  extends AdminDisableProviderForUserResponse,
    __MetadataBearer {}
declare const AdminDisableProviderForUserCommand_base: {
  new (
    input: AdminDisableProviderForUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminDisableProviderForUserCommandInput,
    AdminDisableProviderForUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminDisableProviderForUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminDisableProviderForUserCommandInput,
    AdminDisableProviderForUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminDisableProviderForUserCommand extends AdminDisableProviderForUserCommand_base {
  protected static __types: {
    api: {
      input: AdminDisableProviderForUserRequest;
      output: {};
    };
    sdk: {
      input: AdminDisableProviderForUserCommandInput;
      output: AdminDisableProviderForUserCommandOutput;
    };
  };
}
