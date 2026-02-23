import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  UpdateUserAttributesRequest,
  UpdateUserAttributesResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface UpdateUserAttributesCommandInput
  extends UpdateUserAttributesRequest {}
export interface UpdateUserAttributesCommandOutput
  extends UpdateUserAttributesResponse,
    __MetadataBearer {}
declare const UpdateUserAttributesCommand_base: {
  new (
    input: UpdateUserAttributesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateUserAttributesCommandInput,
    UpdateUserAttributesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: UpdateUserAttributesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateUserAttributesCommandInput,
    UpdateUserAttributesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class UpdateUserAttributesCommand extends UpdateUserAttributesCommand_base {
  protected static __types: {
    api: {
      input: UpdateUserAttributesRequest;
      output: UpdateUserAttributesResponse;
    };
    sdk: {
      input: UpdateUserAttributesCommandInput;
      output: UpdateUserAttributesCommandOutput;
    };
  };
}
