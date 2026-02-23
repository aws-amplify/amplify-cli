import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  UpdateDeviceStatusRequest,
  UpdateDeviceStatusResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface UpdateDeviceStatusCommandInput
  extends UpdateDeviceStatusRequest {}
export interface UpdateDeviceStatusCommandOutput
  extends UpdateDeviceStatusResponse,
    __MetadataBearer {}
declare const UpdateDeviceStatusCommand_base: {
  new (
    input: UpdateDeviceStatusCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateDeviceStatusCommandInput,
    UpdateDeviceStatusCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: UpdateDeviceStatusCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateDeviceStatusCommandInput,
    UpdateDeviceStatusCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class UpdateDeviceStatusCommand extends UpdateDeviceStatusCommand_base {
  protected static __types: {
    api: {
      input: UpdateDeviceStatusRequest;
      output: {};
    };
    sdk: {
      input: UpdateDeviceStatusCommandInput;
      output: UpdateDeviceStatusCommandOutput;
    };
  };
}
