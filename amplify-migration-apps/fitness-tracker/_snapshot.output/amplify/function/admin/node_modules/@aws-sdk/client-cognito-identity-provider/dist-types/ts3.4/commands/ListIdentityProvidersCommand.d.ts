import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  ListIdentityProvidersRequest,
  ListIdentityProvidersResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ListIdentityProvidersCommandInput
  extends ListIdentityProvidersRequest {}
export interface ListIdentityProvidersCommandOutput
  extends ListIdentityProvidersResponse,
    __MetadataBearer {}
declare const ListIdentityProvidersCommand_base: {
  new (
    input: ListIdentityProvidersCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListIdentityProvidersCommandInput,
    ListIdentityProvidersCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ListIdentityProvidersCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListIdentityProvidersCommandInput,
    ListIdentityProvidersCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ListIdentityProvidersCommand extends ListIdentityProvidersCommand_base {
  protected static __types: {
    api: {
      input: ListIdentityProvidersRequest;
      output: ListIdentityProvidersResponse;
    };
    sdk: {
      input: ListIdentityProvidersCommandInput;
      output: ListIdentityProvidersCommandOutput;
    };
  };
}
