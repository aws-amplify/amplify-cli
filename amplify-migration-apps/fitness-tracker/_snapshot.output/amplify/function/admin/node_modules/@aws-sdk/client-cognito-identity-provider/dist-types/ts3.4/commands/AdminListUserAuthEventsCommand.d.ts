import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminListUserAuthEventsRequest,
  AdminListUserAuthEventsResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminListUserAuthEventsCommandInput
  extends AdminListUserAuthEventsRequest {}
export interface AdminListUserAuthEventsCommandOutput
  extends AdminListUserAuthEventsResponse,
    __MetadataBearer {}
declare const AdminListUserAuthEventsCommand_base: {
  new (
    input: AdminListUserAuthEventsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminListUserAuthEventsCommandInput,
    AdminListUserAuthEventsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminListUserAuthEventsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminListUserAuthEventsCommandInput,
    AdminListUserAuthEventsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminListUserAuthEventsCommand extends AdminListUserAuthEventsCommand_base {
  protected static __types: {
    api: {
      input: AdminListUserAuthEventsRequest;
      output: AdminListUserAuthEventsResponse;
    };
    sdk: {
      input: AdminListUserAuthEventsCommandInput;
      output: AdminListUserAuthEventsCommandOutput;
    };
  };
}
