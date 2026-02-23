import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { UpdateGroupRequest, UpdateGroupResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface UpdateGroupCommandInput extends UpdateGroupRequest {}
export interface UpdateGroupCommandOutput
  extends UpdateGroupResponse,
    __MetadataBearer {}
declare const UpdateGroupCommand_base: {
  new (
    input: UpdateGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateGroupCommandInput,
    UpdateGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: UpdateGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    UpdateGroupCommandInput,
    UpdateGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class UpdateGroupCommand extends UpdateGroupCommand_base {
  protected static __types: {
    api: {
      input: UpdateGroupRequest;
      output: UpdateGroupResponse;
    };
    sdk: {
      input: UpdateGroupCommandInput;
      output: UpdateGroupCommandOutput;
    };
  };
}
