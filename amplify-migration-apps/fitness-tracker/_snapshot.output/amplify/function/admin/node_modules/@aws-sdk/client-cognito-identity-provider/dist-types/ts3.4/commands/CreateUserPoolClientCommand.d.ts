import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  CreateUserPoolClientRequest,
  CreateUserPoolClientResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface CreateUserPoolClientCommandInput
  extends CreateUserPoolClientRequest {}
export interface CreateUserPoolClientCommandOutput
  extends CreateUserPoolClientResponse,
    __MetadataBearer {}
declare const CreateUserPoolClientCommand_base: {
  new (
    input: CreateUserPoolClientCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateUserPoolClientCommandInput,
    CreateUserPoolClientCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: CreateUserPoolClientCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateUserPoolClientCommandInput,
    CreateUserPoolClientCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class CreateUserPoolClientCommand extends CreateUserPoolClientCommand_base {
  protected static __types: {
    api: {
      input: CreateUserPoolClientRequest;
      output: CreateUserPoolClientResponse;
    };
    sdk: {
      input: CreateUserPoolClientCommandInput;
      output: CreateUserPoolClientCommandOutput;
    };
  };
}
