import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  StartUserImportJobRequest,
  StartUserImportJobResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface StartUserImportJobCommandInput
  extends StartUserImportJobRequest {}
export interface StartUserImportJobCommandOutput
  extends StartUserImportJobResponse,
    __MetadataBearer {}
declare const StartUserImportJobCommand_base: {
  new (
    input: StartUserImportJobCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    StartUserImportJobCommandInput,
    StartUserImportJobCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: StartUserImportJobCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    StartUserImportJobCommandInput,
    StartUserImportJobCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class StartUserImportJobCommand extends StartUserImportJobCommand_base {
  protected static __types: {
    api: {
      input: StartUserImportJobRequest;
      output: StartUserImportJobResponse;
    };
    sdk: {
      input: StartUserImportJobCommandInput;
      output: StartUserImportJobCommandOutput;
    };
  };
}
