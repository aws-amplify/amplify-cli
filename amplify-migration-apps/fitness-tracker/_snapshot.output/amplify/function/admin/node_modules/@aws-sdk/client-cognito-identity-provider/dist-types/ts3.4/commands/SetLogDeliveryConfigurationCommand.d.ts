import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  SetLogDeliveryConfigurationRequest,
  SetLogDeliveryConfigurationResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface SetLogDeliveryConfigurationCommandInput
  extends SetLogDeliveryConfigurationRequest {}
export interface SetLogDeliveryConfigurationCommandOutput
  extends SetLogDeliveryConfigurationResponse,
    __MetadataBearer {}
declare const SetLogDeliveryConfigurationCommand_base: {
  new (
    input: SetLogDeliveryConfigurationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    SetLogDeliveryConfigurationCommandInput,
    SetLogDeliveryConfigurationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: SetLogDeliveryConfigurationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    SetLogDeliveryConfigurationCommandInput,
    SetLogDeliveryConfigurationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class SetLogDeliveryConfigurationCommand extends SetLogDeliveryConfigurationCommand_base {
  protected static __types: {
    api: {
      input: SetLogDeliveryConfigurationRequest;
      output: SetLogDeliveryConfigurationResponse;
    };
    sdk: {
      input: SetLogDeliveryConfigurationCommandInput;
      output: SetLogDeliveryConfigurationCommandOutput;
    };
  };
}
