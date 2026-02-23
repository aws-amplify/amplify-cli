import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { DeleteIdentityProviderRequest } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DeleteIdentityProviderCommandInput
  extends DeleteIdentityProviderRequest {}
export interface DeleteIdentityProviderCommandOutput extends __MetadataBearer {}
declare const DeleteIdentityProviderCommand_base: {
  new (
    input: DeleteIdentityProviderCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteIdentityProviderCommandInput,
    DeleteIdentityProviderCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DeleteIdentityProviderCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteIdentityProviderCommandInput,
    DeleteIdentityProviderCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DeleteIdentityProviderCommand extends DeleteIdentityProviderCommand_base {
  protected static __types: {
    api: {
      input: DeleteIdentityProviderRequest;
      output: {};
    };
    sdk: {
      input: DeleteIdentityProviderCommandInput;
      output: DeleteIdentityProviderCommandOutput;
    };
  };
}
