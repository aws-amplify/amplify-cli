import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  UpdateIdentityProviderRequest,
  UpdateIdentityProviderResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface UpdateIdentityProviderCommandInput
  extends UpdateIdentityProviderRequest {}
export interface UpdateIdentityProviderCommandOutput
  extends UpdateIdentityProviderResponse,
    __MetadataBearer {}
declare const UpdateIdentityProviderCommand_base: {
  new (
    input: UpdateIdentityProviderCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateIdentityProviderCommandInput,
    UpdateIdentityProviderCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: UpdateIdentityProviderCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateIdentityProviderCommandInput,
    UpdateIdentityProviderCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class UpdateIdentityProviderCommand extends UpdateIdentityProviderCommand_base {
  protected static __types: {
    api: {
      input: UpdateIdentityProviderRequest;
      output: UpdateIdentityProviderResponse;
    };
    sdk: {
      input: UpdateIdentityProviderCommandInput;
      output: UpdateIdentityProviderCommandOutput;
    };
  };
}
