import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DescribeIdentityProviderRequest,
  DescribeIdentityProviderResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DescribeIdentityProviderCommandInput
  extends DescribeIdentityProviderRequest {}
export interface DescribeIdentityProviderCommandOutput
  extends DescribeIdentityProviderResponse,
    __MetadataBearer {}
declare const DescribeIdentityProviderCommand_base: {
  new (
    input: DescribeIdentityProviderCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeIdentityProviderCommandInput,
    DescribeIdentityProviderCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DescribeIdentityProviderCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeIdentityProviderCommandInput,
    DescribeIdentityProviderCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DescribeIdentityProviderCommand extends DescribeIdentityProviderCommand_base {
  protected static __types: {
    api: {
      input: DescribeIdentityProviderRequest;
      output: DescribeIdentityProviderResponse;
    };
    sdk: {
      input: DescribeIdentityProviderCommandInput;
      output: DescribeIdentityProviderCommandOutput;
    };
  };
}
