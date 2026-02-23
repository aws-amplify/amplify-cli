import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { ListTermsRequest, ListTermsResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ListTermsCommandInput extends ListTermsRequest {}
export interface ListTermsCommandOutput
  extends ListTermsResponse,
    __MetadataBearer {}
declare const ListTermsCommand_base: {
  new (
    input: ListTermsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListTermsCommandInput,
    ListTermsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ListTermsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListTermsCommandInput,
    ListTermsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ListTermsCommand extends ListTermsCommand_base {
  protected static __types: {
    api: {
      input: ListTermsRequest;
      output: ListTermsResponse;
    };
    sdk: {
      input: ListTermsCommandInput;
      output: ListTermsCommandOutput;
    };
  };
}
