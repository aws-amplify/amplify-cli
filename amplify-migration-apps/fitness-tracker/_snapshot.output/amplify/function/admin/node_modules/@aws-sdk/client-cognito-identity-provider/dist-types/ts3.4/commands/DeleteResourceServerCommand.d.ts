import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { DeleteResourceServerRequest } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DeleteResourceServerCommandInput
  extends DeleteResourceServerRequest {}
export interface DeleteResourceServerCommandOutput extends __MetadataBearer {}
declare const DeleteResourceServerCommand_base: {
  new (
    input: DeleteResourceServerCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteResourceServerCommandInput,
    DeleteResourceServerCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DeleteResourceServerCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteResourceServerCommandInput,
    DeleteResourceServerCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DeleteResourceServerCommand extends DeleteResourceServerCommand_base {
  protected static __types: {
    api: {
      input: DeleteResourceServerRequest;
      output: {};
    };
    sdk: {
      input: DeleteResourceServerCommandInput;
      output: DeleteResourceServerCommandOutput;
    };
  };
}
