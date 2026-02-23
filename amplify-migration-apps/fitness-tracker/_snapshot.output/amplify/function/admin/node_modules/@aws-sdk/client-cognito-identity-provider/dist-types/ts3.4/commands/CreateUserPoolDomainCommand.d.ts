import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  CreateUserPoolDomainRequest,
  CreateUserPoolDomainResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface CreateUserPoolDomainCommandInput
  extends CreateUserPoolDomainRequest {}
export interface CreateUserPoolDomainCommandOutput
  extends CreateUserPoolDomainResponse,
    __MetadataBearer {}
declare const CreateUserPoolDomainCommand_base: {
  new (
    input: CreateUserPoolDomainCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateUserPoolDomainCommandInput,
    CreateUserPoolDomainCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: CreateUserPoolDomainCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateUserPoolDomainCommandInput,
    CreateUserPoolDomainCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class CreateUserPoolDomainCommand extends CreateUserPoolDomainCommand_base {
  protected static __types: {
    api: {
      input: CreateUserPoolDomainRequest;
      output: CreateUserPoolDomainResponse;
    };
    sdk: {
      input: CreateUserPoolDomainCommandInput;
      output: CreateUserPoolDomainCommandOutput;
    };
  };
}
