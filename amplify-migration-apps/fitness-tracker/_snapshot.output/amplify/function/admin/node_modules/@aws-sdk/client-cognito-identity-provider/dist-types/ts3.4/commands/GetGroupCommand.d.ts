import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { GetGroupRequest, GetGroupResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetGroupCommandInput extends GetGroupRequest {}
export interface GetGroupCommandOutput
  extends GetGroupResponse,
    __MetadataBearer {}
declare const GetGroupCommand_base: {
  new (
    input: GetGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetGroupCommandInput,
    GetGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GetGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetGroupCommandInput,
    GetGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class GetGroupCommand extends GetGroupCommand_base {
  protected static __types: {
    api: {
      input: GetGroupRequest;
      output: GetGroupResponse;
    };
    sdk: {
      input: GetGroupCommandInput;
      output: GetGroupCommandOutput;
    };
  };
}
