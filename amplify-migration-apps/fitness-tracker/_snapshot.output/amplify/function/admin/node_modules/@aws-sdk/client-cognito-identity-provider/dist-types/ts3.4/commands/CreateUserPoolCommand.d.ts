import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  CreateUserPoolRequest,
  CreateUserPoolResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface CreateUserPoolCommandInput extends CreateUserPoolRequest {}
export interface CreateUserPoolCommandOutput
  extends CreateUserPoolResponse,
    __MetadataBearer {}
declare const CreateUserPoolCommand_base: {
  new (
    input: CreateUserPoolCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateUserPoolCommandInput,
    CreateUserPoolCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: CreateUserPoolCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateUserPoolCommandInput,
    CreateUserPoolCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class CreateUserPoolCommand extends CreateUserPoolCommand_base {
  protected static __types: {
    api: {
      input: CreateUserPoolRequest;
      output: CreateUserPoolResponse;
    };
    sdk: {
      input: CreateUserPoolCommandInput;
      output: CreateUserPoolCommandOutput;
    };
  };
}
