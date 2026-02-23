import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  CreateResourceServerRequest,
  CreateResourceServerResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface CreateResourceServerCommandInput
  extends CreateResourceServerRequest {}
export interface CreateResourceServerCommandOutput
  extends CreateResourceServerResponse,
    __MetadataBearer {}
declare const CreateResourceServerCommand_base: {
  new (
    input: CreateResourceServerCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateResourceServerCommandInput,
    CreateResourceServerCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: CreateResourceServerCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateResourceServerCommandInput,
    CreateResourceServerCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class CreateResourceServerCommand extends CreateResourceServerCommand_base {
  protected static __types: {
    api: {
      input: CreateResourceServerRequest;
      output: CreateResourceServerResponse;
    };
    sdk: {
      input: CreateResourceServerCommandInput;
      output: CreateResourceServerCommandOutput;
    };
  };
}
