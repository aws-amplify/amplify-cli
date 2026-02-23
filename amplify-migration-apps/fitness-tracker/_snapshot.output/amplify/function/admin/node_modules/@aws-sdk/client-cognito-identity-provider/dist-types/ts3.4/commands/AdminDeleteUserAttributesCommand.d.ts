import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminDeleteUserAttributesRequest,
  AdminDeleteUserAttributesResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminDeleteUserAttributesCommandInput
  extends AdminDeleteUserAttributesRequest {}
export interface AdminDeleteUserAttributesCommandOutput
  extends AdminDeleteUserAttributesResponse,
    __MetadataBearer {}
declare const AdminDeleteUserAttributesCommand_base: {
  new (
    input: AdminDeleteUserAttributesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminDeleteUserAttributesCommandInput,
    AdminDeleteUserAttributesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminDeleteUserAttributesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminDeleteUserAttributesCommandInput,
    AdminDeleteUserAttributesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminDeleteUserAttributesCommand extends AdminDeleteUserAttributesCommand_base {
  protected static __types: {
    api: {
      input: AdminDeleteUserAttributesRequest;
      output: {};
    };
    sdk: {
      input: AdminDeleteUserAttributesCommandInput;
      output: AdminDeleteUserAttributesCommandOutput;
    };
  };
}
