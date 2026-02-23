import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  UpdateResourceServerRequest,
  UpdateResourceServerResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface UpdateResourceServerCommandInput
  extends UpdateResourceServerRequest {}
export interface UpdateResourceServerCommandOutput
  extends UpdateResourceServerResponse,
    __MetadataBearer {}
declare const UpdateResourceServerCommand_base: {
  new (
    input: UpdateResourceServerCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateResourceServerCommandInput,
    UpdateResourceServerCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: UpdateResourceServerCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateResourceServerCommandInput,
    UpdateResourceServerCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class UpdateResourceServerCommand extends UpdateResourceServerCommand_base {
  protected static __types: {
    api: {
      input: UpdateResourceServerRequest;
      output: UpdateResourceServerResponse;
    };
    sdk: {
      input: UpdateResourceServerCommandInput;
      output: UpdateResourceServerCommandOutput;
    };
  };
}
