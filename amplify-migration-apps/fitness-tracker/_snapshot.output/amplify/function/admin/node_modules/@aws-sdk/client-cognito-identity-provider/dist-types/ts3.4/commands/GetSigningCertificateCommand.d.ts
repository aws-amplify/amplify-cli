import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  GetSigningCertificateRequest,
  GetSigningCertificateResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface GetSigningCertificateCommandInput
  extends GetSigningCertificateRequest {}
export interface GetSigningCertificateCommandOutput
  extends GetSigningCertificateResponse,
    __MetadataBearer {}
declare const GetSigningCertificateCommand_base: {
  new (
    input: GetSigningCertificateCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetSigningCertificateCommandInput,
    GetSigningCertificateCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: GetSigningCertificateCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    GetSigningCertificateCommandInput,
    GetSigningCertificateCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class GetSigningCertificateCommand extends GetSigningCertificateCommand_base {
  protected static __types: {
    api: {
      input: GetSigningCertificateRequest;
      output: GetSigningCertificateResponse;
    };
    sdk: {
      input: GetSigningCertificateCommandInput;
      output: GetSigningCertificateCommandOutput;
    };
  };
}
