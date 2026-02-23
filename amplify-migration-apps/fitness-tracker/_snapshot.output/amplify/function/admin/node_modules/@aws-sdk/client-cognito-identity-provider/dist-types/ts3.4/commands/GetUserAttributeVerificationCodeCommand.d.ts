import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  GetUserAttributeVerificationCodeRequest,
  GetUserAttributeVerificationCodeResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetUserAttributeVerificationCodeCommandInput
  extends GetUserAttributeVerificationCodeRequest {}
export interface GetUserAttributeVerificationCodeCommandOutput
  extends GetUserAttributeVerificationCodeResponse,
    __MetadataBearer {}
declare const GetUserAttributeVerificationCodeCommand_base: {
  new (
    input: GetUserAttributeVerificationCodeCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetUserAttributeVerificationCodeCommandInput,
    GetUserAttributeVerificationCodeCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GetUserAttributeVerificationCodeCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetUserAttributeVerificationCodeCommandInput,
    GetUserAttributeVerificationCodeCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class GetUserAttributeVerificationCodeCommand extends GetUserAttributeVerificationCodeCommand_base {
  protected static __types: {
    api: {
      input: GetUserAttributeVerificationCodeRequest;
      output: GetUserAttributeVerificationCodeResponse;
    };
    sdk: {
      input: GetUserAttributeVerificationCodeCommandInput;
      output: GetUserAttributeVerificationCodeCommandOutput;
    };
  };
}
