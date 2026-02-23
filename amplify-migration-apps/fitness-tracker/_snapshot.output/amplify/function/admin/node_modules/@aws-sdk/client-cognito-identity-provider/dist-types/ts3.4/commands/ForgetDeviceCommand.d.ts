import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { ForgetDeviceRequest } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ForgetDeviceCommandInput extends ForgetDeviceRequest {}
export interface ForgetDeviceCommandOutput extends __MetadataBearer {}
declare const ForgetDeviceCommand_base: {
  new (
    input: ForgetDeviceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ForgetDeviceCommandInput,
    ForgetDeviceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ForgetDeviceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ForgetDeviceCommandInput,
    ForgetDeviceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ForgetDeviceCommand extends ForgetDeviceCommand_base {
  protected static __types: {
    api: {
      input: ForgetDeviceRequest;
      output: {};
    };
    sdk: {
      input: ForgetDeviceCommandInput;
      output: ForgetDeviceCommandOutput;
    };
  };
}
