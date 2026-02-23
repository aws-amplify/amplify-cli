import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  ConfirmDeviceRequest,
  ConfirmDeviceResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ConfirmDeviceCommandInput extends ConfirmDeviceRequest {}
export interface ConfirmDeviceCommandOutput
  extends ConfirmDeviceResponse,
    __MetadataBearer {}
declare const ConfirmDeviceCommand_base: {
  new (
    input: ConfirmDeviceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ConfirmDeviceCommandInput,
    ConfirmDeviceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ConfirmDeviceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ConfirmDeviceCommandInput,
    ConfirmDeviceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ConfirmDeviceCommand extends ConfirmDeviceCommand_base {
  protected static __types: {
    api: {
      input: ConfirmDeviceRequest;
      output: ConfirmDeviceResponse;
    };
    sdk: {
      input: ConfirmDeviceCommandInput;
      output: ConfirmDeviceCommandOutput;
    };
  };
}
