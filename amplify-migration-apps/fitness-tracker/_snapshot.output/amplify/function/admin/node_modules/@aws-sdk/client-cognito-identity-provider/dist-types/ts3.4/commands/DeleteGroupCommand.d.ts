import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { DeleteGroupRequest } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DeleteGroupCommandInput extends DeleteGroupRequest {}
export interface DeleteGroupCommandOutput extends __MetadataBearer {}
declare const DeleteGroupCommand_base: {
  new (
    input: DeleteGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteGroupCommandInput,
    DeleteGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DeleteGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteGroupCommandInput,
    DeleteGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DeleteGroupCommand extends DeleteGroupCommand_base {
  protected static __types: {
    api: {
      input: DeleteGroupRequest;
      output: {};
    };
    sdk: {
      input: DeleteGroupCommandInput;
      output: DeleteGroupCommandOutput;
    };
  };
}
