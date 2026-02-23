import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  GetLogDeliveryConfigurationRequest,
  GetLogDeliveryConfigurationResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetLogDeliveryConfigurationCommandInput
  extends GetLogDeliveryConfigurationRequest {}
export interface GetLogDeliveryConfigurationCommandOutput
  extends GetLogDeliveryConfigurationResponse,
    __MetadataBearer {}
declare const GetLogDeliveryConfigurationCommand_base: {
  new (
    input: GetLogDeliveryConfigurationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetLogDeliveryConfigurationCommandInput,
    GetLogDeliveryConfigurationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GetLogDeliveryConfigurationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetLogDeliveryConfigurationCommandInput,
    GetLogDeliveryConfigurationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class GetLogDeliveryConfigurationCommand extends GetLogDeliveryConfigurationCommand_base {
  protected static __types: {
    api: {
      input: GetLogDeliveryConfigurationRequest;
      output: GetLogDeliveryConfigurationResponse;
    };
    sdk: {
      input: GetLogDeliveryConfigurationCommandInput;
      output: GetLogDeliveryConfigurationCommandOutput;
    };
  };
}
