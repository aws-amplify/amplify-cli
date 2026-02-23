import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminSetUserSettingsRequest,
  AdminSetUserSettingsResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminSetUserSettingsCommandInput
  extends AdminSetUserSettingsRequest {}
export interface AdminSetUserSettingsCommandOutput
  extends AdminSetUserSettingsResponse,
    __MetadataBearer {}
declare const AdminSetUserSettingsCommand_base: {
  new (
    input: AdminSetUserSettingsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminSetUserSettingsCommandInput,
    AdminSetUserSettingsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminSetUserSettingsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminSetUserSettingsCommandInput,
    AdminSetUserSettingsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminSetUserSettingsCommand extends AdminSetUserSettingsCommand_base {
  protected static __types: {
    api: {
      input: AdminSetUserSettingsRequest;
      output: {};
    };
    sdk: {
      input: AdminSetUserSettingsCommandInput;
      output: AdminSetUserSettingsCommandOutput;
    };
  };
}
