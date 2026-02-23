import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DescribeRiskConfigurationRequest,
  DescribeRiskConfigurationResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DescribeRiskConfigurationCommandInput
  extends DescribeRiskConfigurationRequest {}
export interface DescribeRiskConfigurationCommandOutput
  extends DescribeRiskConfigurationResponse,
    __MetadataBearer {}
declare const DescribeRiskConfigurationCommand_base: {
  new (
    input: DescribeRiskConfigurationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeRiskConfigurationCommandInput,
    DescribeRiskConfigurationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DescribeRiskConfigurationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeRiskConfigurationCommandInput,
    DescribeRiskConfigurationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DescribeRiskConfigurationCommand extends DescribeRiskConfigurationCommand_base {
  protected static __types: {
    api: {
      input: DescribeRiskConfigurationRequest;
      output: DescribeRiskConfigurationResponse;
    };
    sdk: {
      input: DescribeRiskConfigurationCommandInput;
      output: DescribeRiskConfigurationCommandOutput;
    };
  };
}
