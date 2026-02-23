import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  StopUserImportJobRequest,
  StopUserImportJobResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface StopUserImportJobCommandInput
  extends StopUserImportJobRequest {}
export interface StopUserImportJobCommandOutput
  extends StopUserImportJobResponse,
    __MetadataBearer {}
declare const StopUserImportJobCommand_base: {
  new (
    input: StopUserImportJobCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    StopUserImportJobCommandInput,
    StopUserImportJobCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: StopUserImportJobCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    StopUserImportJobCommandInput,
    StopUserImportJobCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class StopUserImportJobCommand extends StopUserImportJobCommand_base {
  protected static __types: {
    api: {
      input: StopUserImportJobRequest;
      output: StopUserImportJobResponse;
    };
    sdk: {
      input: StopUserImportJobCommandInput;
      output: StopUserImportJobCommandOutput;
    };
  };
}
