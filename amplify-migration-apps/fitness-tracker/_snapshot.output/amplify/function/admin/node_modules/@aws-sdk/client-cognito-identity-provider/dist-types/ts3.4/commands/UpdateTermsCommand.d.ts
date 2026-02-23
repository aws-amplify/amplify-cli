import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { UpdateTermsRequest, UpdateTermsResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface UpdateTermsCommandInput extends UpdateTermsRequest {}
export interface UpdateTermsCommandOutput
  extends UpdateTermsResponse,
    __MetadataBearer {}
declare const UpdateTermsCommand_base: {
  new (
    input: UpdateTermsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateTermsCommandInput,
    UpdateTermsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: UpdateTermsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateTermsCommandInput,
    UpdateTermsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class UpdateTermsCommand extends UpdateTermsCommand_base {
  protected static __types: {
    api: {
      input: UpdateTermsRequest;
      output: UpdateTermsResponse;
    };
    sdk: {
      input: UpdateTermsCommandInput;
      output: UpdateTermsCommandOutput;
    };
  };
}
