import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  ListResourceServersRequest,
  ListResourceServersResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ListResourceServersCommandInput
  extends ListResourceServersRequest {}
export interface ListResourceServersCommandOutput
  extends ListResourceServersResponse,
    __MetadataBearer {}
declare const ListResourceServersCommand_base: {
  new (
    input: ListResourceServersCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListResourceServersCommandInput,
    ListResourceServersCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ListResourceServersCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListResourceServersCommandInput,
    ListResourceServersCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ListResourceServersCommand extends ListResourceServersCommand_base {
  protected static __types: {
    api: {
      input: ListResourceServersRequest;
      output: ListResourceServersResponse;
    };
    sdk: {
      input: ListResourceServersCommandInput;
      output: ListResourceServersCommandOutput;
    };
  };
}
