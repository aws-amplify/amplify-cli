import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  ListUserImportJobsRequest,
  ListUserImportJobsResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ListUserImportJobsCommandInput
  extends ListUserImportJobsRequest {}
export interface ListUserImportJobsCommandOutput
  extends ListUserImportJobsResponse,
    __MetadataBearer {}
declare const ListUserImportJobsCommand_base: {
  new (
    input: ListUserImportJobsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListUserImportJobsCommandInput,
    ListUserImportJobsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ListUserImportJobsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListUserImportJobsCommandInput,
    ListUserImportJobsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ListUserImportJobsCommand extends ListUserImportJobsCommand_base {
  protected static __types: {
    api: {
      input: ListUserImportJobsRequest;
      output: ListUserImportJobsResponse;
    };
    sdk: {
      input: ListUserImportJobsCommandInput;
      output: ListUserImportJobsCommandOutput;
    };
  };
}
