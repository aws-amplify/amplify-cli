import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { AdminRemoveUserFromGroupRequest } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminRemoveUserFromGroupCommandInput
  extends AdminRemoveUserFromGroupRequest {}
export interface AdminRemoveUserFromGroupCommandOutput
  extends __MetadataBearer {}
declare const AdminRemoveUserFromGroupCommand_base: {
  new (
    input: AdminRemoveUserFromGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminRemoveUserFromGroupCommandInput,
    AdminRemoveUserFromGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminRemoveUserFromGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminRemoveUserFromGroupCommandInput,
    AdminRemoveUserFromGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminRemoveUserFromGroupCommand extends AdminRemoveUserFromGroupCommand_base {
  protected static __types: {
    api: {
      input: AdminRemoveUserFromGroupRequest;
      output: {};
    };
    sdk: {
      input: AdminRemoveUserFromGroupCommandInput;
      output: AdminRemoveUserFromGroupCommandOutput;
    };
  };
}
