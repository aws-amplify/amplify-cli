import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminCreateUserRequest,
  AdminCreateUserResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminCreateUserCommandInput extends AdminCreateUserRequest {}
export interface AdminCreateUserCommandOutput
  extends AdminCreateUserResponse,
    __MetadataBearer {}
declare const AdminCreateUserCommand_base: {
  new (
    input: AdminCreateUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminCreateUserCommandInput,
    AdminCreateUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminCreateUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminCreateUserCommandInput,
    AdminCreateUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminCreateUserCommand extends AdminCreateUserCommand_base {
  protected static __types: {
    api: {
      input: AdminCreateUserRequest;
      output: AdminCreateUserResponse;
    };
    sdk: {
      input: AdminCreateUserCommandInput;
      output: AdminCreateUserCommandOutput;
    };
  };
}
