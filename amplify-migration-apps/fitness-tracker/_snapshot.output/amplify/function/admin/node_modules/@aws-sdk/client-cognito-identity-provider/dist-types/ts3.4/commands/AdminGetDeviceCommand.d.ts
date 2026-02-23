import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminGetDeviceRequest,
  AdminGetDeviceResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminGetDeviceCommandInput extends AdminGetDeviceRequest {}
export interface AdminGetDeviceCommandOutput
  extends AdminGetDeviceResponse,
    __MetadataBearer {}
declare const AdminGetDeviceCommand_base: {
  new (
    input: AdminGetDeviceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminGetDeviceCommandInput,
    AdminGetDeviceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminGetDeviceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminGetDeviceCommandInput,
    AdminGetDeviceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminGetDeviceCommand extends AdminGetDeviceCommand_base {
  protected static __types: {
    api: {
      input: AdminGetDeviceRequest;
      output: AdminGetDeviceResponse;
    };
    sdk: {
      input: AdminGetDeviceCommandInput;
      output: AdminGetDeviceCommandOutput;
    };
  };
}
