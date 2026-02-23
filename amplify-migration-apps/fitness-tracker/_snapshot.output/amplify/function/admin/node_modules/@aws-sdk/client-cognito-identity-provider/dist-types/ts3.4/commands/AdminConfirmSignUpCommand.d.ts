import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminConfirmSignUpRequest,
  AdminConfirmSignUpResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminConfirmSignUpCommandInput
  extends AdminConfirmSignUpRequest {}
export interface AdminConfirmSignUpCommandOutput
  extends AdminConfirmSignUpResponse,
    __MetadataBearer {}
declare const AdminConfirmSignUpCommand_base: {
  new (
    input: AdminConfirmSignUpCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminConfirmSignUpCommandInput,
    AdminConfirmSignUpCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminConfirmSignUpCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminConfirmSignUpCommandInput,
    AdminConfirmSignUpCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminConfirmSignUpCommand extends AdminConfirmSignUpCommand_base {
  protected static __types: {
    api: {
      input: AdminConfirmSignUpRequest;
      output: {};
    };
    sdk: {
      input: AdminConfirmSignUpCommandInput;
      output: AdminConfirmSignUpCommandOutput;
    };
  };
}
