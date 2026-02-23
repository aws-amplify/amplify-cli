import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminUpdateDeviceStatusRequest,
  AdminUpdateDeviceStatusResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminUpdateDeviceStatusCommandInput
  extends AdminUpdateDeviceStatusRequest {}
export interface AdminUpdateDeviceStatusCommandOutput
  extends AdminUpdateDeviceStatusResponse,
    __MetadataBearer {}
declare const AdminUpdateDeviceStatusCommand_base: {
  new (
    input: AdminUpdateDeviceStatusCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminUpdateDeviceStatusCommandInput,
    AdminUpdateDeviceStatusCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminUpdateDeviceStatusCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminUpdateDeviceStatusCommandInput,
    AdminUpdateDeviceStatusCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminUpdateDeviceStatusCommand extends AdminUpdateDeviceStatusCommand_base {
  protected static __types: {
    api: {
      input: AdminUpdateDeviceStatusRequest;
      output: {};
    };
    sdk: {
      input: AdminUpdateDeviceStatusCommandInput;
      output: AdminUpdateDeviceStatusCommandOutput;
    };
  };
}
