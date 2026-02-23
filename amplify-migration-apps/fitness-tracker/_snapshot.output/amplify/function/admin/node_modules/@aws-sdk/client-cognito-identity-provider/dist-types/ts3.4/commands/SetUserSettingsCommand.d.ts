import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  SetUserSettingsRequest,
  SetUserSettingsResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface SetUserSettingsCommandInput extends SetUserSettingsRequest {}
export interface SetUserSettingsCommandOutput
  extends SetUserSettingsResponse,
    __MetadataBearer {}
declare const SetUserSettingsCommand_base: {
  new (
    input: SetUserSettingsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    SetUserSettingsCommandInput,
    SetUserSettingsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: SetUserSettingsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    SetUserSettingsCommandInput,
    SetUserSettingsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class SetUserSettingsCommand extends SetUserSettingsCommand_base {
  protected static __types: {
    api: {
      input: SetUserSettingsRequest;
      output: {};
    };
    sdk: {
      input: SetUserSettingsCommandInput;
      output: SetUserSettingsCommandOutput;
    };
  };
}
