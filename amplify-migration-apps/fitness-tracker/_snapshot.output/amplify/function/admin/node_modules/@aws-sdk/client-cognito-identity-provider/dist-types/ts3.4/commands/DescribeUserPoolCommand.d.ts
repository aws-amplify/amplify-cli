import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DescribeUserPoolRequest,
  DescribeUserPoolResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DescribeUserPoolCommandInput extends DescribeUserPoolRequest {}
export interface DescribeUserPoolCommandOutput
  extends DescribeUserPoolResponse,
    __MetadataBearer {}
declare const DescribeUserPoolCommand_base: {
  new (
    input: DescribeUserPoolCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeUserPoolCommandInput,
    DescribeUserPoolCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DescribeUserPoolCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeUserPoolCommandInput,
    DescribeUserPoolCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DescribeUserPoolCommand extends DescribeUserPoolCommand_base {
  protected static __types: {
    api: {
      input: DescribeUserPoolRequest;
      output: DescribeUserPoolResponse;
    };
    sdk: {
      input: DescribeUserPoolCommandInput;
      output: DescribeUserPoolCommandOutput;
    };
  };
}
