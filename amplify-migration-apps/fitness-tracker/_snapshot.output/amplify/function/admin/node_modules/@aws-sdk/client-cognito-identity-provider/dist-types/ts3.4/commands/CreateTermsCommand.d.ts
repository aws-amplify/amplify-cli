import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { CreateTermsRequest, CreateTermsResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface CreateTermsCommandInput extends CreateTermsRequest {}
export interface CreateTermsCommandOutput
  extends CreateTermsResponse,
    __MetadataBearer {}
declare const CreateTermsCommand_base: {
  new (
    input: CreateTermsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateTermsCommandInput,
    CreateTermsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: CreateTermsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateTermsCommandInput,
    CreateTermsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class CreateTermsCommand extends CreateTermsCommand_base {
  protected static __types: {
    api: {
      input: CreateTermsRequest;
      output: CreateTermsResponse;
    };
    sdk: {
      input: CreateTermsCommandInput;
      output: CreateTermsCommandOutput;
    };
  };
}
