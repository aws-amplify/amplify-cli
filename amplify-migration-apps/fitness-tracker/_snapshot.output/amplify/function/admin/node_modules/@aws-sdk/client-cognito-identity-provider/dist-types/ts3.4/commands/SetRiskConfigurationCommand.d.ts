import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  SetRiskConfigurationRequest,
  SetRiskConfigurationResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface SetRiskConfigurationCommandInput
  extends SetRiskConfigurationRequest {}
export interface SetRiskConfigurationCommandOutput
  extends SetRiskConfigurationResponse,
    __MetadataBearer {}
declare const SetRiskConfigurationCommand_base: {
  new (
    input: SetRiskConfigurationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    SetRiskConfigurationCommandInput,
    SetRiskConfigurationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: SetRiskConfigurationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    SetRiskConfigurationCommandInput,
    SetRiskConfigurationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class SetRiskConfigurationCommand extends SetRiskConfigurationCommand_base {
  protected static __types: {
    api: {
      input: SetRiskConfigurationRequest;
      output: SetRiskConfigurationResponse;
    };
    sdk: {
      input: SetRiskConfigurationCommandInput;
      output: SetRiskConfigurationCommandOutput;
    };
  };
}
