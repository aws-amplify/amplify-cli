import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { ListUsersRequest, ListUsersResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ListUsersCommandInput extends ListUsersRequest {}
export interface ListUsersCommandOutput
  extends ListUsersResponse,
    __MetadataBearer {}
declare const ListUsersCommand_base: {
  new (
    input: ListUsersCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListUsersCommandInput,
    ListUsersCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ListUsersCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListUsersCommandInput,
    ListUsersCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ListUsersCommand extends ListUsersCommand_base {
  protected static __types: {
    api: {
      input: ListUsersRequest;
      output: ListUsersResponse;
    };
    sdk: {
      input: ListUsersCommandInput;
      output: ListUsersCommandOutput;
    };
  };
}
