import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DescribeResourceServerRequest,
  DescribeResourceServerResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DescribeResourceServerCommandInput
  extends DescribeResourceServerRequest {}
export interface DescribeResourceServerCommandOutput
  extends DescribeResourceServerResponse,
    __MetadataBearer {}
declare const DescribeResourceServerCommand_base: {
  new (
    input: DescribeResourceServerCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeResourceServerCommandInput,
    DescribeResourceServerCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DescribeResourceServerCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeResourceServerCommandInput,
    DescribeResourceServerCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DescribeResourceServerCommand extends DescribeResourceServerCommand_base {
  protected static __types: {
    api: {
      input: DescribeResourceServerRequest;
      output: DescribeResourceServerResponse;
    };
    sdk: {
      input: DescribeResourceServerCommandInput;
      output: DescribeResourceServerCommandOutput;
    };
  };
}
