import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DeleteWebAuthnCredentialRequest,
  DeleteWebAuthnCredentialResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DeleteWebAuthnCredentialCommandInput
  extends DeleteWebAuthnCredentialRequest {}
export interface DeleteWebAuthnCredentialCommandOutput
  extends DeleteWebAuthnCredentialResponse,
    __MetadataBearer {}
declare const DeleteWebAuthnCredentialCommand_base: {
  new (
    input: DeleteWebAuthnCredentialCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteWebAuthnCredentialCommandInput,
    DeleteWebAuthnCredentialCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DeleteWebAuthnCredentialCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteWebAuthnCredentialCommandInput,
    DeleteWebAuthnCredentialCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DeleteWebAuthnCredentialCommand extends DeleteWebAuthnCredentialCommand_base {
  protected static __types: {
    api: {
      input: DeleteWebAuthnCredentialRequest;
      output: {};
    };
    sdk: {
      input: DeleteWebAuthnCredentialCommandInput;
      output: DeleteWebAuthnCredentialCommandOutput;
    };
  };
}
