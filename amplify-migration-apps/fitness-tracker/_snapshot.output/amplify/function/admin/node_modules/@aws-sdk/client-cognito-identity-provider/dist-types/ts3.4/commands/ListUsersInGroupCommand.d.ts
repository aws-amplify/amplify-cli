import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  ListUsersInGroupRequest,
  ListUsersInGroupResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ListUsersInGroupCommandInput extends ListUsersInGroupRequest {}
export interface ListUsersInGroupCommandOutput
  extends ListUsersInGroupResponse,
    __MetadataBearer {}
declare const ListUsersInGroupCommand_base: {
  new (
    input: ListUsersInGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListUsersInGroupCommandInput,
    ListUsersInGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ListUsersInGroupCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListUsersInGroupCommandInput,
    ListUsersInGroupCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ListUsersInGroupCommand extends ListUsersInGroupCommand_base {
  protected static __types: {
    api: {
      input: ListUsersInGroupRequest;
      output: ListUsersInGroupResponse;
    };
    sdk: {
      input: ListUsersInGroupCommandInput;
      output: ListUsersInGroupCommandOutput;
    };
  };
}
