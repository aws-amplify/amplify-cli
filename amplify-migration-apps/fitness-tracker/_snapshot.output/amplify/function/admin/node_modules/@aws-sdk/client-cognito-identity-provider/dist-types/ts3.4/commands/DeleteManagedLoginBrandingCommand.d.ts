import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { DeleteManagedLoginBrandingRequest } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DeleteManagedLoginBrandingCommandInput
  extends DeleteManagedLoginBrandingRequest {}
export interface DeleteManagedLoginBrandingCommandOutput
  extends __MetadataBearer {}
declare const DeleteManagedLoginBrandingCommand_base: {
  new (
    input: DeleteManagedLoginBrandingCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteManagedLoginBrandingCommandInput,
    DeleteManagedLoginBrandingCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DeleteManagedLoginBrandingCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteManagedLoginBrandingCommandInput,
    DeleteManagedLoginBrandingCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DeleteManagedLoginBrandingCommand extends DeleteManagedLoginBrandingCommand_base {
  protected static __types: {
    api: {
      input: DeleteManagedLoginBrandingRequest;
      output: {};
    };
    sdk: {
      input: DeleteManagedLoginBrandingCommandInput;
      output: DeleteManagedLoginBrandingCommandOutput;
    };
  };
}
