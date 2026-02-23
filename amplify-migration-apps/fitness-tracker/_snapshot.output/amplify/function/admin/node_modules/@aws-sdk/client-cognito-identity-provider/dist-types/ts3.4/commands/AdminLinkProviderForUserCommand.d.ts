import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminLinkProviderForUserRequest,
  AdminLinkProviderForUserResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminLinkProviderForUserCommandInput
  extends AdminLinkProviderForUserRequest {}
export interface AdminLinkProviderForUserCommandOutput
  extends AdminLinkProviderForUserResponse,
    __MetadataBearer {}
declare const AdminLinkProviderForUserCommand_base: {
  new (
    input: AdminLinkProviderForUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminLinkProviderForUserCommandInput,
    AdminLinkProviderForUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminLinkProviderForUserCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminLinkProviderForUserCommandInput,
    AdminLinkProviderForUserCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminLinkProviderForUserCommand extends AdminLinkProviderForUserCommand_base {
  protected static __types: {
    api: {
      input: AdminLinkProviderForUserRequest;
      output: {};
    };
    sdk: {
      input: AdminLinkProviderForUserCommandInput;
      output: AdminLinkProviderForUserCommandOutput;
    };
  };
}
