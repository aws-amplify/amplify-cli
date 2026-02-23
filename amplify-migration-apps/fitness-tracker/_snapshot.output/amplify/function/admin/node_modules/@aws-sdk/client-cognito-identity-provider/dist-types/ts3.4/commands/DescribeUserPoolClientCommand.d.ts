import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DescribeUserPoolClientRequest,
  DescribeUserPoolClientResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DescribeUserPoolClientCommandInput
  extends DescribeUserPoolClientRequest {}
export interface DescribeUserPoolClientCommandOutput
  extends DescribeUserPoolClientResponse,
    __MetadataBearer {}
declare const DescribeUserPoolClientCommand_base: {
  new (
    input: DescribeUserPoolClientCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeUserPoolClientCommandInput,
    DescribeUserPoolClientCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DescribeUserPoolClientCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeUserPoolClientCommandInput,
    DescribeUserPoolClientCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DescribeUserPoolClientCommand extends DescribeUserPoolClientCommand_base {
  protected static __types: {
    api: {
      input: DescribeUserPoolClientRequest;
      output: DescribeUserPoolClientResponse;
    };
    sdk: {
      input: DescribeUserPoolClientCommandInput;
      output: DescribeUserPoolClientCommandOutput;
    };
  };
}
