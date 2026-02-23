import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  GetUserAuthFactorsRequest,
  GetUserAuthFactorsResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetUserAuthFactorsCommandInput
  extends GetUserAuthFactorsRequest {}
export interface GetUserAuthFactorsCommandOutput
  extends GetUserAuthFactorsResponse,
    __MetadataBearer {}
declare const GetUserAuthFactorsCommand_base: {
  new (
    input: GetUserAuthFactorsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetUserAuthFactorsCommandInput,
    GetUserAuthFactorsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GetUserAuthFactorsCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetUserAuthFactorsCommandInput,
    GetUserAuthFactorsCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class GetUserAuthFactorsCommand extends GetUserAuthFactorsCommand_base {
  protected static __types: {
    api: {
      input: GetUserAuthFactorsRequest;
      output: GetUserAuthFactorsResponse;
    };
    sdk: {
      input: GetUserAuthFactorsCommandInput;
      output: GetUserAuthFactorsCommandOutput;
    };
  };
}
