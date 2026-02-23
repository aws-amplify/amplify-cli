import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  GetUICustomizationRequest,
  GetUICustomizationResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetUICustomizationCommandInput
  extends GetUICustomizationRequest {}
export interface GetUICustomizationCommandOutput
  extends GetUICustomizationResponse,
    __MetadataBearer {}
declare const GetUICustomizationCommand_base: {
  new (
    input: GetUICustomizationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetUICustomizationCommandInput,
    GetUICustomizationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GetUICustomizationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetUICustomizationCommandInput,
    GetUICustomizationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class GetUICustomizationCommand extends GetUICustomizationCommand_base {
  protected static __types: {
    api: {
      input: GetUICustomizationRequest;
      output: GetUICustomizationResponse;
    };
    sdk: {
      input: GetUICustomizationCommandInput;
      output: GetUICustomizationCommandOutput;
    };
  };
}
