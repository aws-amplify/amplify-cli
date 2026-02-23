import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { CreateGroupRequest, CreateGroupResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface CreateGroupCommandInput extends CreateGroupRequest {}
export interface CreateGroupCommandOutput
  extends CreateGroupResponse,
    __MetadataBearer {}
declare const CreateGroupCommand_base: {
  new (
    input: CreateGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateGroupCommandInput,
    CreateGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: CreateGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    CreateGroupCommandInput,
    CreateGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class CreateGroupCommand extends CreateGroupCommand_base {
  protected static __types: {
    api: {
      input: CreateGroupRequest;
      output: CreateGroupResponse;
    };
    sdk: {
      input: CreateGroupCommandInput;
      output: CreateGroupCommandOutput;
    };
  };
}
