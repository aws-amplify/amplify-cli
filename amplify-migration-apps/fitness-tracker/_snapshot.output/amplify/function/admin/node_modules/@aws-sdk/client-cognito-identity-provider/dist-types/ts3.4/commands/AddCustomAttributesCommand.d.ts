import { Command as $Command } from "@smithy/smithy-client";
import { MetadataBearer as __MetadataBearer } from "@smithy/types";
import {
  CognitoIdentityProviderClientResolvedConfig,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../CognitoIdentityProviderClient";
import {
  AddCustomAttributesRequest,
  AddCustomAttributesResponse,
} from "../models/models_0";
export { __MetadataBearer };
export { $Command };
export interface AddCustomAttributesCommandInput
  extends AddCustomAttributesRequest {}
export interface AddCustomAttributesCommandOutput
  extends AddCustomAttributesResponse,
    __MetadataBearer {}
declare const AddCustomAttributesCommand_base: {
  new (
    input: AddCustomAttributesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AddCustomAttributesCommandInput,
    AddCustomAttributesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  new (
    input: AddCustomAttributesCommandInput
  ): import("@smithy/smithy-client").CommandImpl<
    AddCustomAttributesCommandInput,
    AddCustomAttributesCommandOutput,
    CognitoIdentityProviderClientResolvedConfig,
    ServiceInputTypes,
    ServiceOutputTypes
  >;
  getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
export declare class AddCustomAttributesCommand extends AddCustomAttributesCommand_base {
  protected static __types: {
    api: {
      input: AddCustomAttributesRequest;
      output: {};
    };
    sdk: {
      input: AddCustomAttributesCommandInput;
      output: AddCustomAttributesCommandOutput;
    };
  };
}
