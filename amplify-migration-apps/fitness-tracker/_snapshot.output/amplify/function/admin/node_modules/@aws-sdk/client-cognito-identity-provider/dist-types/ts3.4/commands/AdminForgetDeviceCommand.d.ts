import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { AdminForgetDeviceRequest } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminForgetDeviceCommandInput
  extends AdminForgetDeviceRequest {}
export interface AdminForgetDeviceCommandOutput extends __MetadataBearer {}
declare const AdminForgetDeviceCommand_base: {
  new (
    input: AdminForgetDeviceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminForgetDeviceCommandInput,
    AdminForgetDeviceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminForgetDeviceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminForgetDeviceCommandInput,
    AdminForgetDeviceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminForgetDeviceCommand extends AdminForgetDeviceCommand_base {
  protected static __types: {
    api: {
      input: AdminForgetDeviceRequest;
      output: {};
    };
    sdk: {
      input: AdminForgetDeviceCommandInput;
      output: AdminForgetDeviceCommandOutput;
    };
  };
}
