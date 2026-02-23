import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AdminListDevicesRequest,
  AdminListDevicesResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AdminListDevicesCommandInput extends AdminListDevicesRequest {}
export interface AdminListDevicesCommandOutput
  extends AdminListDevicesResponse,
    __MetadataBearer {}
declare const AdminListDevicesCommand_base: {
  new (
    input: AdminListDevicesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminListDevicesCommandInput,
    AdminListDevicesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AdminListDevicesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AdminListDevicesCommandInput,
    AdminListDevicesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AdminListDevicesCommand extends AdminListDevicesCommand_base {
  protected static __types: {
    api: {
      input: AdminListDevicesRequest;
      output: AdminListDevicesResponse;
    };
    sdk: {
      input: AdminListDevicesCommandInput;
      output: AdminListDevicesCommandOutput;
    };
  };
}
