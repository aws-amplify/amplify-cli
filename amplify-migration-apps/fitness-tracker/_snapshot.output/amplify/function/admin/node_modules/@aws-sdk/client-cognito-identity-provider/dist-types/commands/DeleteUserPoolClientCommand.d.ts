import { Command as $Command } from "@smithy/smithy-client";
import type { MetadataBearer as __MetadataBearer } from "@smithy/types";
import type { CognitoIdentityProviderClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes } from "../CognitoIdentityProviderClient";
import type { DeleteUserPoolClientRequest } from "../models/models_0";
/**
 * @public
 */
export type { __MetadataBearer };
export { $Command };
/**
 * @public
 *
 * The input for {@link DeleteUserPoolClientCommand}.
 */
export interface DeleteUserPoolClientCommandInput extends DeleteUserPoolClientRequest {
}
/**
 * @public
 *
 * The output of {@link DeleteUserPoolClientCommand}.
 */
export interface DeleteUserPoolClientCommandOutput extends __MetadataBearer {
}
declare const DeleteUserPoolClientCommand_base: {
    new (input: DeleteUserPoolClientCommandInput): import("@smithy/smithy-client").CommandImpl<DeleteUserPoolClientCommandInput, DeleteUserPoolClientCommandOutput, CognitoIdentityProviderClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes>;
    new (input: DeleteUserPoolClientCommandInput): import("@smithy/smithy-client").CommandImpl<DeleteUserPoolClientCommandInput, DeleteUserPoolClientCommandOutput, CognitoIdentityProviderClientResolvedConfig, ServiceInputTypes, ServiceOutputTypes>;
    getEndpointParameterInstructions(): import("@smithy/middleware-endpoint").EndpointParameterInstructions;
};
/**
 * <p>Deletes a user pool app client. After you delete an app client, users can no longer
 *             sign in to the associated application.</p>
 * @example
 * Use a bare-bones client and the command you need to make an API call.
 * ```javascript
 * import { CognitoIdentityProviderClient, DeleteUserPoolClientCommand } from "@aws-sdk/client-cognito-identity-provider"; // ES Modules import
 * // const { CognitoIdentityProviderClient, DeleteUserPoolClientCommand } = require("@aws-sdk/client-cognito-identity-provider"); // CommonJS import
 * // import type { CognitoIdentityProviderClientConfig } from "@aws-sdk/client-cognito-identity-provider";
 * const config = {}; // type is CognitoIdentityProviderClientConfig
 * const client = new CognitoIdentityProviderClient(config);
 * const input = { // DeleteUserPoolClientRequest
 *   UserPoolId: "STRING_VALUE", // required
 *   ClientId: "STRING_VALUE", // required
 * };
 * const command = new DeleteUserPoolClientCommand(input);
 * const response = await client.send(command);
 * // {};
 *
 * ```
 *
 * @param DeleteUserPoolClientCommandInput - {@link DeleteUserPoolClientCommandInput}
 * @returns {@link DeleteUserPoolClientCommandOutput}
 * @see {@link DeleteUserPoolClientCommandInput} for command's `input` shape.
 * @see {@link DeleteUserPoolClientCommandOutput} for command's `response` shape.
 * @see {@link CognitoIdentityProviderClientResolvedConfig | config} for CognitoIdentityProviderClient's `config` shape.
 *
 * @throws {@link ConcurrentModificationException} (client fault)
 *  <p>This exception is thrown if two or more modifications are happening
 *             concurrently.</p>
 *
 * @throws {@link InternalErrorException} (server fault)
 *  <p>This exception is thrown when Amazon Cognito encounters an internal error.</p>
 *
 * @throws {@link InvalidParameterException} (client fault)
 *  <p>This exception is thrown when the Amazon Cognito service encounters an invalid
 *             parameter.</p>
 *
 * @throws {@link NotAuthorizedException} (client fault)
 *  <p>This exception is thrown when a user isn't authorized.</p>
 *
 * @throws {@link ResourceNotFoundException} (client fault)
 *  <p>This exception is thrown when the Amazon Cognito service can't find the requested
 *             resource.</p>
 *
 * @throws {@link TooManyRequestsException} (client fault)
 *  <p>This exception is thrown when the user has made too many requests for a given
 *             operation.</p>
 *
 * @throws {@link CognitoIdentityProviderServiceException}
 * <p>Base exception class for all service exceptions from CognitoIdentityProvider service.</p>
 *
 *
 * @public
 */
export declare class DeleteUserPoolClientCommand extends DeleteUserPoolClientCommand_base {
    /** @internal type navigation helper, not in runtime. */
    protected static __types: {
        api: {
            input: DeleteUserPoolClientRequest;
            output: {};
        };
        sdk: {
            input: DeleteUserPoolClientCommandInput;
            output: DeleteUserPoolClientCommandOutput;
        };
    };
}
