import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  GetTokensFromRefreshTokenRequest,
  GetTokensFromRefreshTokenResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetTokensFromRefreshTokenCommandInput
  extends GetTokensFromRefreshTokenRequest {}
export interface GetTokensFromRefreshTokenCommandOutput
  extends GetTokensFromRefreshTokenResponse,
    __MetadataBearer {}
declare const GetTokensFromRefreshTokenCommand_base: {
  new (
    input: GetTokensFromRefreshTokenCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetTokensFromRefreshTokenCommandInput,
    GetTokensFromRefreshTokenCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GetTokensFromRefreshTokenCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetTokensFromRefreshTokenCommandInput,
    GetTokensFromRefreshTokenCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class GetTokensFromRefreshTokenCommand extends GetTokensFromRefreshTokenCommand_base {
  protected static __types: {
    api: {
      input: GetTokensFromRefreshTokenRequest;
      output: GetTokensFromRefreshTokenResponse;
    };
    sdk: {
      input: GetTokensFromRefreshTokenCommandInput;
      output: GetTokensFromRefreshTokenCommandOutput;
    };
  };
}
