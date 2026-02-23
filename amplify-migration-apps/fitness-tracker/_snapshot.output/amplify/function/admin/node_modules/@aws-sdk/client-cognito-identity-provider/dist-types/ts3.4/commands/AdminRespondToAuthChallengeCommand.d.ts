import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminRespondToAuthChallengeRequest,
  AdminRespondToAuthChallengeResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminRespondToAuthChallengeCommandInput
  extends AdminRespondToAuthChallengeRequest {}
export interface AdminRespondToAuthChallengeCommandOutput
  extends AdminRespondToAuthChallengeResponse,
    __MetadataBearer {}
declare const AdminRespondToAuthChallengeCommand_base: {
  new (
    input: AdminRespondToAuthChallengeCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminRespondToAuthChallengeCommandInput,
    AdminRespondToAuthChallengeCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminRespondToAuthChallengeCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminRespondToAuthChallengeCommandInput,
    AdminRespondToAuthChallengeCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminRespondToAuthChallengeCommand extends AdminRespondToAuthChallengeCommand_base {
  protected static __types: {
    api: {
      input: AdminRespondToAuthChallengeRequest;
      output: AdminRespondToAuthChallengeResponse;
    };
    sdk: {
      input: AdminRespondToAuthChallengeCommandInput;
      output: AdminRespondToAuthChallengeCommandOutput;
    };
  };
}
