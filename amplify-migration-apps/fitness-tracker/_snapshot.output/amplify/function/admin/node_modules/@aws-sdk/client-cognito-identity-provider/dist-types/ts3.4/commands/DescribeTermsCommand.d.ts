import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DescribeTermsRequest,
  DescribeTermsResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DescribeTermsCommandInput extends DescribeTermsRequest {}
export interface DescribeTermsCommandOutput
  extends DescribeTermsResponse,
    __MetadataBearer {}
declare const DescribeTermsCommand_base: {
  new (
    input: DescribeTermsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeTermsCommandInput,
    DescribeTermsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DescribeTermsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeTermsCommandInput,
    DescribeTermsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DescribeTermsCommand extends DescribeTermsCommand_base {
  protected static __types: {
    api: {
      input: DescribeTermsRequest;
      output: DescribeTermsResponse;
    };
    sdk: {
      input: DescribeTermsCommandInput;
      output: DescribeTermsCommandOutput;
    };
  };
}
