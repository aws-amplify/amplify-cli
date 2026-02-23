import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DescribeManagedLoginBrandingByClientRequest,
  DescribeManagedLoginBrandingByClientResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DescribeManagedLoginBrandingByClientCommandInput
  extends DescribeManagedLoginBrandingByClientRequest {}
export interface DescribeManagedLoginBrandingByClientCommandOutput
  extends DescribeManagedLoginBrandingByClientResponse,
    __MetadataBearer {}
declare const DescribeManagedLoginBrandingByClientCommand_base: {
  new (
    input: DescribeManagedLoginBrandingByClientCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeManagedLoginBrandingByClientCommandInput,
    DescribeManagedLoginBrandingByClientCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DescribeManagedLoginBrandingByClientCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeManagedLoginBrandingByClientCommandInput,
    DescribeManagedLoginBrandingByClientCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DescribeManagedLoginBrandingByClientCommand extends DescribeManagedLoginBrandingByClientCommand_base {
  protected static __types: {
    api: {
      input: DescribeManagedLoginBrandingByClientRequest;
      output: DescribeManagedLoginBrandingByClientResponse;
    };
    sdk: {
      input: DescribeManagedLoginBrandingByClientCommandInput;
      output: DescribeManagedLoginBrandingByClientCommandOutput;
    };
  };
}
