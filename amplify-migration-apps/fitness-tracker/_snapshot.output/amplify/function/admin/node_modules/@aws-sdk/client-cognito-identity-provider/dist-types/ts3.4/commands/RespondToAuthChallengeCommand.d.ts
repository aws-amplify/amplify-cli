import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  RespondToAuthChallengeRequest,
  RespondToAuthChallengeResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface RespondToAuthChallengeCommandInput
  extends RespondToAuthChallengeRequest {}
export interface RespondToAuthChallengeCommandOutput
  extends RespondToAuthChallengeResponse,
    __MetadataBearer {}
declare const RespondToAuthChallengeCommand_base: {
  new (
    input: RespondToAuthChallengeCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    RespondToAuthChallengeCommandInput,
    RespondToAuthChallengeCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: RespondToAuthChallengeCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    RespondToAuthChallengeCommandInput,
    RespondToAuthChallengeCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class RespondToAuthChallengeCommand extends RespondToAuthChallengeCommand_base {
  protected static __types: {
    api: {
      input: RespondToAuthChallengeRequest;
      output: RespondToAuthChallengeResponse;
    };
    sdk: {
      input: RespondToAuthChallengeCommandInput;
      output: RespondToAuthChallengeCommandOutput;
    };
  };
}
