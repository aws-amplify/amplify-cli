import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  UpdateAuthEventFeedbackRequest,
  UpdateAuthEventFeedbackResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface UpdateAuthEventFeedbackCommandInput
  extends UpdateAuthEventFeedbackRequest {}
export interface UpdateAuthEventFeedbackCommandOutput
  extends UpdateAuthEventFeedbackResponse,
    __MetadataBearer {}
declare const UpdateAuthEventFeedbackCommand_base: {
  new (
    input: UpdateAuthEventFeedbackCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateAuthEventFeedbackCommandInput,
    UpdateAuthEventFeedbackCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: UpdateAuthEventFeedbackCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateAuthEventFeedbackCommandInput,
    UpdateAuthEventFeedbackCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class UpdateAuthEventFeedbackCommand extends UpdateAuthEventFeedbackCommand_base {
  protected static __types: {
    api: {
      input: UpdateAuthEventFeedbackRequest;
      output: {};
    };
    sdk: {
      input: UpdateAuthEventFeedbackCommandInput;
      output: UpdateAuthEventFeedbackCommandOutput;
    };
  };
}
