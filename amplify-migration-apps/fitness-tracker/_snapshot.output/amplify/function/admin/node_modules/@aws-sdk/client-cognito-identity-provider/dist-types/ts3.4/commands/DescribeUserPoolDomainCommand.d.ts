import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DescribeUserPoolDomainRequest,
  DescribeUserPoolDomainResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DescribeUserPoolDomainCommandInput
  extends DescribeUserPoolDomainRequest {}
export interface DescribeUserPoolDomainCommandOutput
  extends DescribeUserPoolDomainResponse,
    __MetadataBearer {}
declare const DescribeUserPoolDomainCommand_base: {
  new (
    input: DescribeUserPoolDomainCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeUserPoolDomainCommandInput,
    DescribeUserPoolDomainCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DescribeUserPoolDomainCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeUserPoolDomainCommandInput,
    DescribeUserPoolDomainCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DescribeUserPoolDomainCommand extends DescribeUserPoolDomainCommand_base {
  protected static __types: {
    api: {
      input: DescribeUserPoolDomainRequest;
      output: DescribeUserPoolDomainResponse;
    };
    sdk: {
      input: DescribeUserPoolDomainCommandInput;
      output: DescribeUserPoolDomainCommandOutput;
    };
  };
}
