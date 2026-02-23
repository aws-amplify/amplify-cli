import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminUpdateUserAttributesRequest,
  AdminUpdateUserAttributesResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminUpdateUserAttributesCommandInput
  extends AdminUpdateUserAttributesRequest {}
export interface AdminUpdateUserAttributesCommandOutput
  extends AdminUpdateUserAttributesResponse,
    __MetadataBearer {}
declare const AdminUpdateUserAttributesCommand_base: {
  new (
    input: AdminUpdateUserAttributesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminUpdateUserAttributesCommandInput,
    AdminUpdateUserAttributesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminUpdateUserAttributesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminUpdateUserAttributesCommandInput,
    AdminUpdateUserAttributesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminUpdateUserAttributesCommand extends AdminUpdateUserAttributesCommand_base {
  protected static __types: {
    api: {
      input: AdminUpdateUserAttributesRequest;
      output: {};
    };
    sdk: {
      input: AdminUpdateUserAttributesCommandInput;
      output: AdminUpdateUserAttributesCommandOutput;
    };
  };
}
