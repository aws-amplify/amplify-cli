import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  CreateIdentityProviderRequest,
  CreateIdentityProviderResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface CreateIdentityProviderCommandInput
  extends CreateIdentityProviderRequest {}
export interface CreateIdentityProviderCommandOutput
  extends CreateIdentityProviderResponse,
    __MetadataBearer {}
declare const CreateIdentityProviderCommand_base: {
  new (
    input: CreateIdentityProviderCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateIdentityProviderCommandInput,
    CreateIdentityProviderCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: CreateIdentityProviderCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateIdentityProviderCommandInput,
    CreateIdentityProviderCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class CreateIdentityProviderCommand extends CreateIdentityProviderCommand_base {
  protected static __types: {
    api: {
      input: CreateIdentityProviderRequest;
      output: CreateIdentityProviderResponse;
    };
    sdk: {
      input: CreateIdentityProviderCommandInput;
      output: CreateIdentityProviderCommandOutput;
    };
  };
}
