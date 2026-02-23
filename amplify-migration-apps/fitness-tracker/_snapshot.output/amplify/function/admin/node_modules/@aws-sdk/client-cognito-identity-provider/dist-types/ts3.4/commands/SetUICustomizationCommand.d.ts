import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  SetUICustomizationRequest,
  SetUICustomizationResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface SetUICustomizationCommandInput
  extends SetUICustomizationRequest {}
export interface SetUICustomizationCommandOutput
  extends SetUICustomizationResponse,
    __MetadataBearer {}
declare const SetUICustomizationCommand_base: {
  new (
    input: SetUICustomizationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    SetUICustomizationCommandInput,
    SetUICustomizationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: SetUICustomizationCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    SetUICustomizationCommandInput,
    SetUICustomizationCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class SetUICustomizationCommand extends SetUICustomizationCommand_base {
  protected static __types: {
    api: {
      input: SetUICustomizationRequest;
      output: SetUICustomizationResponse;
    };
    sdk: {
      input: SetUICustomizationCommandInput;
      output: SetUICustomizationCommandOutput;
    };
  };
}
