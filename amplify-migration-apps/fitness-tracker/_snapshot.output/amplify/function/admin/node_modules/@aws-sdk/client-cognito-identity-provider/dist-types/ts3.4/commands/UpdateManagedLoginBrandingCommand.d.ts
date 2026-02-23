import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  UpdateManagedLoginBrandingRequest,
  UpdateManagedLoginBrandingResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface UpdateManagedLoginBrandingCommandInput
  extends UpdateManagedLoginBrandingRequest {}
export interface UpdateManagedLoginBrandingCommandOutput
  extends UpdateManagedLoginBrandingResponse,
    __MetadataBearer {}
declare const UpdateManagedLoginBrandingCommand_base: {
  new (
    input: UpdateManagedLoginBrandingCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateManagedLoginBrandingCommandInput,
    UpdateManagedLoginBrandingCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    ...[input]: [] | [UpdateManagedLoginBrandingCommandInput]
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateManagedLoginBrandingCommandInput,
    UpdateManagedLoginBrandingCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class UpdateManagedLoginBrandingCommand extends UpdateManagedLoginBrandingCommand_base {
  protected static __types: {
    api: {
      input: UpdateManagedLoginBrandingRequest;
      output: UpdateManagedLoginBrandingResponse;
    };
    sdk: {
      input: UpdateManagedLoginBrandingCommandInput;
      output: UpdateManagedLoginBrandingCommandOutput;
    };
  };
}
