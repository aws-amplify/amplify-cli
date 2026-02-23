import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  CreateUserImportJobRequest,
  CreateUserImportJobResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface CreateUserImportJobCommandInput
  extends CreateUserImportJobRequest {}
export interface CreateUserImportJobCommandOutput
  extends CreateUserImportJobResponse,
    __MetadataBearer {}
declare const CreateUserImportJobCommand_base: {
  new (
    input: CreateUserImportJobCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateUserImportJobCommandInput,
    CreateUserImportJobCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: CreateUserImportJobCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateUserImportJobCommandInput,
    CreateUserImportJobCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class CreateUserImportJobCommand extends CreateUserImportJobCommand_base {
  protected static __types: {
    api: {
      input: CreateUserImportJobRequest;
      output: CreateUserImportJobResponse;
    };
    sdk: {
      input: CreateUserImportJobCommandInput;
      output: CreateUserImportJobCommandOutput;
    };
  };
}
