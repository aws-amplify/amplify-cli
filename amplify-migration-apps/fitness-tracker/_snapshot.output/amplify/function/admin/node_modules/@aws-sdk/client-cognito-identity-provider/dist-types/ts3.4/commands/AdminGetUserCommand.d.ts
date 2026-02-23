import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { AdminGetUserRequest, AdminGetUserResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminGetUserCommandInput extends AdminGetUserRequest {}
export interface AdminGetUserCommandOutput
  extends AdminGetUserResponse,
    __MetadataBearer {}
declare const AdminGetUserCommand_base: {
  new (
    input: AdminGetUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminGetUserCommandInput,
    AdminGetUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminGetUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminGetUserCommandInput,
    AdminGetUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminGetUserCommand extends AdminGetUserCommand_base {
  protected static __types: {
    api: {
      input: AdminGetUserRequest;
      output: AdminGetUserResponse;
    };
    sdk: {
      input: AdminGetUserCommandInput;
      output: AdminGetUserCommandOutput;
    };
  };
}
