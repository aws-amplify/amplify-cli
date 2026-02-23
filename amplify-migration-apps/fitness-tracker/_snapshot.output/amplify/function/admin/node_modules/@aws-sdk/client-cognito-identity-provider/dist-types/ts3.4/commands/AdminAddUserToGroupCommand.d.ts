import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { AdminAddUserToGroupRequest } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminAddUserToGroupCommandInput
  extends AdminAddUserToGroupRequest {}
export interface AdminAddUserToGroupCommandOutput extends __MetadataBearer {}
declare const AdminAddUserToGroupCommand_base: {
  new (
    input: AdminAddUserToGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminAddUserToGroupCommandInput,
    AdminAddUserToGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminAddUserToGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminAddUserToGroupCommandInput,
    AdminAddUserToGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminAddUserToGroupCommand extends AdminAddUserToGroupCommand_base {
  protected static __types: {
    api: {
      input: AdminAddUserToGroupRequest;
      output: {};
    };
    sdk: {
      input: AdminAddUserToGroupCommandInput;
      output: AdminAddUserToGroupCommandOutput;
    };
  };
}
