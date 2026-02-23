import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DeleteUserAttributesRequest,
  DeleteUserAttributesResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DeleteUserAttributesCommandInput
  extends DeleteUserAttributesRequest {}
export interface DeleteUserAttributesCommandOutput
  extends DeleteUserAttributesResponse,
    __MetadataBearer {}
declare const DeleteUserAttributesCommand_base: {
  new (
    input: DeleteUserAttributesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteUserAttributesCommandInput,
    DeleteUserAttributesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DeleteUserAttributesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteUserAttributesCommandInput,
    DeleteUserAttributesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DeleteUserAttributesCommand extends DeleteUserAttributesCommand_base {
  protected static __types: {
    api: {
      input: DeleteUserAttributesRequest;
      output: {};
    };
    sdk: {
      input: DeleteUserAttributesCommandInput;
      output: DeleteUserAttributesCommandOutput;
    };
  };
}
