import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { DeleteUserPoolClientRequest } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DeleteUserPoolClientCommandInput
  extends DeleteUserPoolClientRequest {}
export interface DeleteUserPoolClientCommandOutput extends __MetadataBearer {}
declare const DeleteUserPoolClientCommand_base: {
  new (
    input: DeleteUserPoolClientCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteUserPoolClientCommandInput,
    DeleteUserPoolClientCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DeleteUserPoolClientCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteUserPoolClientCommandInput,
    DeleteUserPoolClientCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DeleteUserPoolClientCommand extends DeleteUserPoolClientCommand_base {
  protected static __types: {
    api: {
      input: DeleteUserPoolClientRequest;
      output: {};
    };
    sdk: {
      input: DeleteUserPoolClientCommandInput;
      output: DeleteUserPoolClientCommandOutput;
    };
  };
}
