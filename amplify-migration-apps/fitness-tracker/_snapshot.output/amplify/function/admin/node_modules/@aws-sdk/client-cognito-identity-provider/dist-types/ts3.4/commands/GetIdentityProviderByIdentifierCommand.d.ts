import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  GetIdentityProviderByIdentifierRequest,
  GetIdentityProviderByIdentifierResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetIdentityProviderByIdentifierCommandInput
  extends GetIdentityProviderByIdentifierRequest {}
export interface GetIdentityProviderByIdentifierCommandOutput
  extends GetIdentityProviderByIdentifierResponse,
    __MetadataBearer {}
declare const GetIdentityProviderByIdentifierCommand_base: {
  new (
    input: GetIdentityProviderByIdentifierCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetIdentityProviderByIdentifierCommandInput,
    GetIdentityProviderByIdentifierCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GetIdentityProviderByIdentifierCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetIdentityProviderByIdentifierCommandInput,
    GetIdentityProviderByIdentifierCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class GetIdentityProviderByIdentifierCommand extends GetIdentityProviderByIdentifierCommand_base {
  protected static __types: {
    api: {
      input: GetIdentityProviderByIdentifierRequest;
      output: GetIdentityProviderByIdentifierResponse;
    };
    sdk: {
      input: GetIdentityProviderByIdentifierCommandInput;
      output: GetIdentityProviderByIdentifierCommandOutput;
    };
  };
}
