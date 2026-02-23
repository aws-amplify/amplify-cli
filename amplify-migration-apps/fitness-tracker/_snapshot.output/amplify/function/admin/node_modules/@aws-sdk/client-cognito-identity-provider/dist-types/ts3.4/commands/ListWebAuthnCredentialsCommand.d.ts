import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  ListWebAuthnCredentialsRequest,
  ListWebAuthnCredentialsResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ListWebAuthnCredentialsCommandInput
  extends ListWebAuthnCredentialsRequest {}
export interface ListWebAuthnCredentialsCommandOutput
  extends ListWebAuthnCredentialsResponse,
    __MetadataBearer {}
declare const ListWebAuthnCredentialsCommand_base: {
  new (
    input: ListWebAuthnCredentialsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListWebAuthnCredentialsCommandInput,
    ListWebAuthnCredentialsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ListWebAuthnCredentialsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListWebAuthnCredentialsCommandInput,
    ListWebAuthnCredentialsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ListWebAuthnCredentialsCommand extends ListWebAuthnCredentialsCommand_base {
  protected static __types: {
    api: {
      input: ListWebAuthnCredentialsRequest;
      output: ListWebAuthnCredentialsResponse;
    };
    sdk: {
      input: ListWebAuthnCredentialsCommandInput;
      output: ListWebAuthnCredentialsCommandOutput;
    };
  };
}
