import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminUpdateAuthEventFeedbackRequest,
  AdminUpdateAuthEventFeedbackResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminUpdateAuthEventFeedbackCommandInput
  extends AdminUpdateAuthEventFeedbackRequest {}
export interface AdminUpdateAuthEventFeedbackCommandOutput
  extends AdminUpdateAuthEventFeedbackResponse,
    __MetadataBearer {}
declare const AdminUpdateAuthEventFeedbackCommand_base: {
  new (
    input: AdminUpdateAuthEventFeedbackCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminUpdateAuthEventFeedbackCommandInput,
    AdminUpdateAuthEventFeedbackCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminUpdateAuthEventFeedbackCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminUpdateAuthEventFeedbackCommandInput,
    AdminUpdateAuthEventFeedbackCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminUpdateAuthEventFeedbackCommand extends AdminUpdateAuthEventFeedbackCommand_base {
  protected static __types: {
    api: {
      input: AdminUpdateAuthEventFeedbackRequest;
      output: {};
    };
    sdk: {
      input: AdminUpdateAuthEventFeedbackCommandInput;
      output: AdminUpdateAuthEventFeedbackCommandOutput;
    };
  };
}
