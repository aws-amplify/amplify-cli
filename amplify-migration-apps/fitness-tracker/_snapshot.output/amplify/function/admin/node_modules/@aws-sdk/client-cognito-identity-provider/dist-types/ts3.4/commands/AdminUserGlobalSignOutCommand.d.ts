import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminUserGlobalSignOutRequest,
  AdminUserGlobalSignOutResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminUserGlobalSignOutCommandInput
  extends AdminUserGlobalSignOutRequest {}
export interface AdminUserGlobalSignOutCommandOutput
  extends AdminUserGlobalSignOutResponse,
    __MetadataBearer {}
declare const AdminUserGlobalSignOutCommand_base: {
  new (
    input: AdminUserGlobalSignOutCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminUserGlobalSignOutCommandInput,
    AdminUserGlobalSignOutCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminUserGlobalSignOutCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminUserGlobalSignOutCommandInput,
    AdminUserGlobalSignOutCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminUserGlobalSignOutCommand extends AdminUserGlobalSignOutCommand_base {
  protected static __types: {
    api: {
      input: AdminUserGlobalSignOutRequest;
      output: {};
    };
    sdk: {
      input: AdminUserGlobalSignOutCommandInput;
      output: AdminUserGlobalSignOutCommandOutput;
    };
  };
}
