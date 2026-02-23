import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DeleteUserPoolDomainRequest,
  DeleteUserPoolDomainResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DeleteUserPoolDomainCommandInput
  extends DeleteUserPoolDomainRequest {}
export interface DeleteUserPoolDomainCommandOutput
  extends DeleteUserPoolDomainResponse,
    __MetadataBearer {}
declare const DeleteUserPoolDomainCommand_base: {
  new (
    input: DeleteUserPoolDomainCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteUserPoolDomainCommandInput,
    DeleteUserPoolDomainCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DeleteUserPoolDomainCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteUserPoolDomainCommandInput,
    DeleteUserPoolDomainCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DeleteUserPoolDomainCommand extends DeleteUserPoolDomainCommand_base {
  protected static __types: {
    api: {
      input: DeleteUserPoolDomainRequest;
      output: {};
    };
    sdk: {
      input: DeleteUserPoolDomainCommandInput;
      output: DeleteUserPoolDomainCommandOutput;
    };
  };
}
