import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminListGroupsForUserRequest,
  AdminListGroupsForUserResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminListGroupsForUserCommandInput
  extends AdminListGroupsForUserRequest {}
export interface AdminListGroupsForUserCommandOutput
  extends AdminListGroupsForUserResponse,
    __MetadataBearer {}
declare const AdminListGroupsForUserCommand_base: {
  new (
    input: AdminListGroupsForUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminListGroupsForUserCommandInput,
    AdminListGroupsForUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminListGroupsForUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminListGroupsForUserCommandInput,
    AdminListGroupsForUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminListGroupsForUserCommand extends AdminListGroupsForUserCommand_base {
  protected static __types: {
    api: {
      input: AdminListGroupsForUserRequest;
      output: AdminListGroupsForUserResponse;
    };
    sdk: {
      input: AdminListGroupsForUserCommandInput;
      output: AdminListGroupsForUserCommandOutput;
    };
  };
}
