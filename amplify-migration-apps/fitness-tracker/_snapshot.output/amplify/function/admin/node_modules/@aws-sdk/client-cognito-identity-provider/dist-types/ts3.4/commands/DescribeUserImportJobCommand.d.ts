import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DescribeUserImportJobRequest,
  DescribeUserImportJobResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DescribeUserImportJobCommandInput
  extends DescribeUserImportJobRequest {}
export interface DescribeUserImportJobCommandOutput
  extends DescribeUserImportJobResponse,
    __MetadataBearer {}
declare const DescribeUserImportJobCommand_base: {
  new (
    input: DescribeUserImportJobCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeUserImportJobCommandInput,
    DescribeUserImportJobCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DescribeUserImportJobCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeUserImportJobCommandInput,
    DescribeUserImportJobCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DescribeUserImportJobCommand extends DescribeUserImportJobCommand_base {
  protected static __types: {
    api: {
      input: DescribeUserImportJobRequest;
      output: DescribeUserImportJobResponse;
    };
    sdk: {
      input: DescribeUserImportJobCommandInput;
      output: DescribeUserImportJobCommandOutput;
    };
  };
}
