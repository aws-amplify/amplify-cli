import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminSetUserMFAPreferenceRequest,
  AdminSetUserMFAPreferenceResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminSetUserMFAPreferenceCommandInput
  extends AdminSetUserMFAPreferenceRequest {}
export interface AdminSetUserMFAPreferenceCommandOutput
  extends AdminSetUserMFAPreferenceResponse,
    __MetadataBearer {}
declare const AdminSetUserMFAPreferenceCommand_base: {
  new (
    input: AdminSetUserMFAPreferenceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminSetUserMFAPreferenceCommandInput,
    AdminSetUserMFAPreferenceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminSetUserMFAPreferenceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminSetUserMFAPreferenceCommandInput,
    AdminSetUserMFAPreferenceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminSetUserMFAPreferenceCommand extends AdminSetUserMFAPreferenceCommand_base {
  protected static __types: {
    api: {
      input: AdminSetUserMFAPreferenceRequest;
      output: {};
    };
    sdk: {
      input: AdminSetUserMFAPreferenceCommandInput;
      output: AdminSetUserMFAPreferenceCommandOutput;
    };
  };
}
