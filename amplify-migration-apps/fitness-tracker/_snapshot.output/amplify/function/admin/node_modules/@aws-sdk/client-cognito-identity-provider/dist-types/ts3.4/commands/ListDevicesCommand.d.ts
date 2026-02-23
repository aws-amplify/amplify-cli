import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import { ListDevicesRequest, ListDevicesResponse } from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface ListDevicesCommandInput extends ListDevicesRequest {}
export interface ListDevicesCommandOutput
  extends ListDevicesResponse,
    __MetadataBearer {}
declare const ListDevicesCommand_base: {
  new (
    input: ListDevicesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListDevicesCommandInput,
    ListDevicesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: ListDevicesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    ListDevicesCommandInput,
    ListDevicesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class ListDevicesCommand extends ListDevicesCommand_base {
  protected static __types: {
    api: {
      input: ListDevicesRequest;
      output: ListDevicesResponse;
    };
    sdk: {
      input: ListDevicesCommandInput;
      output: ListDevicesCommandOutput;
    };
  };
}
