import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { DeleteUserPoolRequest } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DeleteUserPoolCommandInput extends DeleteUserPoolRequest {}
export interface DeleteUserPoolCommandOutput extends __MetadataBearer {}
declare const DeleteUserPoolCommand_base: {
  new (
    input: DeleteUserPoolCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteUserPoolCommandInput,
    DeleteUserPoolCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DeleteUserPoolCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteUserPoolCommandInput,
    DeleteUserPoolCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DeleteUserPoolCommand extends DeleteUserPoolCommand_base {
  protected static __types: {
    api: {
      input: DeleteUserPoolRequest;
      output: {};
    };
    sdk: {
      input: DeleteUserPoolCommandInput;
      output: DeleteUserPoolCommandOutput;
    };
  };
}
