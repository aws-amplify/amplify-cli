import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  CreateManagedLoginBrandingRequest,
  CreateManagedLoginBrandingResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface CreateManagedLoginBrandingCommandInput
  extends CreateManagedLoginBrandingRequest {}
export interface CreateManagedLoginBrandingCommandOutput
  extends CreateManagedLoginBrandingResponse,
    __MetadataBearer {}
declare const CreateManagedLoginBrandingCommand_base: {
  new (
    input: CreateManagedLoginBrandingCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateManagedLoginBrandingCommandInput,
    CreateManagedLoginBrandingCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: CreateManagedLoginBrandingCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateManagedLoginBrandingCommandInput,
    CreateManagedLoginBrandingCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class CreateManagedLoginBrandingCommand extends CreateManagedLoginBrandingCommand_base {
  protected static __types: {
    api: {
      input: CreateManagedLoginBrandingRequest;
      output: CreateManagedLoginBrandingResponse;
    };
    sdk: {
      input: CreateManagedLoginBrandingCommandInput;
      output: CreateManagedLoginBrandingCommandOutput;
    };
  };
}
