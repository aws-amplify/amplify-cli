import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { DeleteTermsRequest } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DeleteTermsCommandInput extends DeleteTermsRequest {}
export interface DeleteTermsCommandOutput extends __MetadataBearer {}
declare const DeleteTermsCommand_base: {
  new (
    input: DeleteTermsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteTermsCommandInput,
    DeleteTermsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DeleteTermsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DeleteTermsCommandInput,
    DeleteTermsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DeleteTermsCommand extends DeleteTermsCommand_base {
  protected static __types: {
    api: {
      input: DeleteTermsRequest;
      output: {};
    };
    sdk: {
      input: DeleteTermsCommandInput;
      output: DeleteTermsCommandOutput;
    };
  };
}
