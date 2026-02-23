import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { GetDeviceRequest, GetDeviceResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetDeviceCommandInput extends GetDeviceRequest {}
export interface GetDeviceCommandOutput
  extends GetDeviceResponse,
    __MetadataBearer {}
declare const GetDeviceCommand_base: {
  new (
    input: GetDeviceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetDeviceCommandInput,
    GetDeviceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GetDeviceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetDeviceCommandInput,
    GetDeviceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class GetDeviceCommand extends GetDeviceCommand_base {
  protected static __types: {
    api: {
      input: GetDeviceRequest;
      output: GetDeviceResponse;
    };
    sdk: {
      input: GetDeviceCommandInput;
      output: GetDeviceCommandOutput;
    };
  };
}
