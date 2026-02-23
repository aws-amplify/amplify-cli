import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { AdminDeleteUserRequest } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminDeleteUserCommandInput extends AdminDeleteUserRequest {}
export interface AdminDeleteUserCommandOutput extends __MetadataBearer {}
declare const AdminDeleteUserCommand_base: {
  new (
    input: AdminDeleteUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminDeleteUserCommandInput,
    AdminDeleteUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminDeleteUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminDeleteUserCommandInput,
    AdminDeleteUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminDeleteUserCommand extends AdminDeleteUserCommand_base {
  protected static __types: {
    api: {
      input: AdminDeleteUserRequest;
      output: {};
    };
    sdk: {
      input: AdminDeleteUserCommandInput;
      output: AdminDeleteUserCommandOutput;
    };
  };
}
