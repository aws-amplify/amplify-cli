import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AssociateSoftwareTokenRequest,
  AssociateSoftwareTokenResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AssociateSoftwareTokenCommandInput
  extends AssociateSoftwareTokenRequest {}
export interface AssociateSoftwareTokenCommandOutput
  extends AssociateSoftwareTokenResponse,
    __MetadataBearer {}
declare const AssociateSoftwareTokenCommand_base: {
  new (
    input: AssociateSoftwareTokenCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AssociateSoftwareTokenCommandInput,
    AssociateSoftwareTokenCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    ...[input]: [] | [AssociateSoftwareTokenCommandInput]
  ): import("@smithy/smithy-client").CommandImpl<
    AssociateSoftwareTokenCommandInput,
    AssociateSoftwareTokenCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AssociateSoftwareTokenCommand extends AssociateSoftwareTokenCommand_base {
  protected static __types: {
    api: {
      input: AssociateSoftwareTokenRequest;
      output: AssociateSoftwareTokenResponse;
    };
    sdk: {
      input: AssociateSoftwareTokenCommandInput;
      output: AssociateSoftwareTokenCommandOutput;
    };
  };
}
