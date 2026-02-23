import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  DescribeManagedLoginBrandingRequest,
  DescribeManagedLoginBrandingResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface DescribeManagedLoginBrandingCommandInput
  extends DescribeManagedLoginBrandingRequest {}
export interface DescribeManagedLoginBrandingCommandOutput
  extends DescribeManagedLoginBrandingResponse,
    __MetadataBearer {}
declare const DescribeManagedLoginBrandingCommand_base: {
  new (
    input: DescribeManagedLoginBrandingCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeManagedLoginBrandingCommandInput,
    DescribeManagedLoginBrandingCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: DescribeManagedLoginBrandingCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    DescribeManagedLoginBrandingCommandInput,
    DescribeManagedLoginBrandingCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class DescribeManagedLoginBrandingCommand extends DescribeManagedLoginBrandingCommand_base {
  protected static __types: {
    api: {
      input: DescribeManagedLoginBrandingRequest;
      output: DescribeManagedLoginBrandingResponse;
    };
    sdk: {
      input: DescribeManagedLoginBrandingCommandInput;
      output: DescribeManagedLoginBrandingCommandOutput;
    };
  };
}
