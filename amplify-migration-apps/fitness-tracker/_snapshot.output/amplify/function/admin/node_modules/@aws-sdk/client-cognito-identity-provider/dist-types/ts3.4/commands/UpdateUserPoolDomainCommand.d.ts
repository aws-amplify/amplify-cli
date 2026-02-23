import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  UpdateUserPoolDomainRequest,
  UpdateUserPoolDomainResponse,
} from "../models/models_1";
export { __MetadataBearer };
export { $Command };
export interface UpdateUserPoolDomainCommandInput
  extends UpdateUserPoolDomainRequest {}
export interface UpdateUserPoolDomainCommandOutput
  extends UpdateUserPoolDomainResponse,
    __MetadataBearer {}
declare const UpdateUserPoolDomainCommand_base: {
  new (
    input: UpdateUserPoolDomainCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateUserPoolDomainCommandInput,
    UpdateUserPoolDomainCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: UpdateUserPoolDomainCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateUserPoolDomainCommandInput,
    UpdateUserPoolDomainCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class UpdateUserPoolDomainCommand extends UpdateUserPoolDomainCommand_base {
  protected static __types: {
    api: {
      input: UpdateUserPoolDomainRequest;
      output: UpdateUserPoolDomainResponse;
    };
    sdk: {
      input: UpdateUserPoolDomainCommandInput;
      output: UpdateUserPoolDomainCommandOutput;
    };
  };
}
