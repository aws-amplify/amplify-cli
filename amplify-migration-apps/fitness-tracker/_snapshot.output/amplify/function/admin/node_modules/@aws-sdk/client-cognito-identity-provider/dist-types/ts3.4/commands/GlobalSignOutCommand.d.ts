import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  GlobalSignOutRequest,
  GlobalSignOutResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GlobalSignOutCommandInput extends GlobalSignOutRequest {}
export interface GlobalSignOutCommandOutput
  extends GlobalSignOutResponse,
    __MetadataBearer {}
declare const GlobalSignOutCommand_base: {
  new (
    input: GlobalSignOutCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GlobalSignOutCommandInput,
    GlobalSignOutCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GlobalSignOutCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GlobalSignOutCommandInput,
    GlobalSignOutCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class GlobalSignOutCommand extends GlobalSignOutCommand_base {
  protected static __types: {
    api: {
      input: GlobalSignOutRequest;
      output: {};
    };
    sdk: {
      input: GlobalSignOutCommandInput;
      output: GlobalSignOutCommandOutput;
    };
  };
}
