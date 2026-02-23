import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  SetUserMFAPreferenceRequest,
  SetUserMFAPreferenceResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface SetUserMFAPreferenceCommandInput
  extends SetUserMFAPreferenceRequest {}
export interface SetUserMFAPreferenceCommandOutput
  extends SetUserMFAPreferenceResponse,
    __MetadataBearer {}
declare const SetUserMFAPreferenceCommand_base: {
  new (
    input: SetUserMFAPreferenceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    SetUserMFAPreferenceCommandInput,
    SetUserMFAPreferenceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: SetUserMFAPreferenceCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    SetUserMFAPreferenceCommandInput,
    SetUserMFAPreferenceCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class SetUserMFAPreferenceCommand extends SetUserMFAPreferenceCommand_base {
  protected static __types: {
    api: {
      input: SetUserMFAPreferenceRequest;
      output: {};
    };
    sdk: {
      input: SetUserMFAPreferenceCommandInput;
      output: SetUserMFAPreferenceCommandOutput;
    };
  };
}
