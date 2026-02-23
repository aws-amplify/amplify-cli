import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { GetCSVHeaderRequest, GetCSVHeaderResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetCSVHeaderCommandInput extends GetCSVHeaderRequest {}
export interface GetCSVHeaderCommandOutput
  extends GetCSVHeaderResponse,
    __MetadataBearer {}
declare const GetCSVHeaderCommand_base: {
  new (
    input: GetCSVHeaderCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetCSVHeaderCommandInput,
    GetCSVHeaderCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GetCSVHeaderCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetCSVHeaderCommandInput,
    GetCSVHeaderCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class GetCSVHeaderCommand extends GetCSVHeaderCommand_base {
  protected static __types: {
    api: {
      input: GetCSVHeaderRequest;
      output: GetCSVHeaderResponse;
    };
    sdk: {
      input: GetCSVHeaderCommandInput;
      output: GetCSVHeaderCommandOutput;
    };
  };
}
