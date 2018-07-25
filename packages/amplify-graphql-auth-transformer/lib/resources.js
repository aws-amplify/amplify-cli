"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cognito_1 = require("cloudform/types/cognito");
var cloudform_1 = require("cloudform");
var ResourceFactory = /** @class */ (function () {
    function ResourceFactory() {
    }
    ResourceFactory.prototype.makeParams = function () {
        var _a;
        return _a = {},
            _a[ResourceFactory.ParameterIds.UserPoolName] = new cloudform_1.StringParameter({
                Description: 'The name of the AppSync API',
                Default: 'AppSyncUserPool'
            }),
            _a[ResourceFactory.ParameterIds.UserPoolMobileClientName] = new cloudform_1.StringParameter({
                Description: 'The name of the native user pool client.',
                Default: 'CognitoNativeClient'
            }),
            _a[ResourceFactory.ParameterIds.UserPoolJSClientName] = new cloudform_1.StringParameter({
                Description: 'The name of the web user pool client.',
                Default: 'CognitoJSClient'
            }),
            _a;
    };
    /**
     * Creates the barebones template for an application.
     */
    ResourceFactory.prototype.initTemplate = function () {
        var _a, _b;
        return {
            Parameters: this.makeParams(),
            Resources: (_a = {},
                _a[ResourceFactory.UserPoolLogicalID] = this.makeUserPool(),
                _a[ResourceFactory.UserPoolNativeClientLogicalID] = this.makeUserPoolNativeClient(),
                _a[ResourceFactory.UserPoolJSClientLogicalID] = this.makeUserPoolJSClient(),
                _a),
            Outputs: (_b = {},
                _b[ResourceFactory.UserPoolNativeClientOutput] = this.makeNativeClientOutput(),
                _b[ResourceFactory.UserPoolJSClientOutput] = this.makeJSClientOutput(),
                _b)
        };
    };
    /**
     * Outputs
     */
    ResourceFactory.prototype.makeNativeClientOutput = function () {
        return {
            Description: "Amazon Cognito UserPools native client ID",
            Value: cloudform_1.Fn.Ref(ResourceFactory.UserPoolNativeClientLogicalID),
            Export: {
                Name: cloudform_1.Fn.Join(':', [cloudform_1.Refs.StackName, "CognitoNativeClient"])
            }
        };
    };
    ResourceFactory.prototype.makeJSClientOutput = function () {
        return {
            Description: "Amazon Cognito UserPools JS client ID",
            Value: cloudform_1.Fn.Ref(ResourceFactory.UserPoolNativeClientLogicalID),
            Export: {
                Name: cloudform_1.Fn.Join(':', [cloudform_1.Refs.StackName, "CognitoJSClient"])
            }
        };
    };
    /**
     * Create the AppSync API.
     */
    ResourceFactory.prototype.makeUserPool = function () {
        return new cognito_1.default.UserPool({
            AliasAttributes: ['email'],
            UserPoolName: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.UserPoolName),
            Policies: {
                // TODO: Parameterize these as mappings so you have loose, medium, and strict options.
                PasswordPolicy: {
                    MinimumLength: 8,
                    RequireLowercase: true,
                    RequireNumbers: true,
                    RequireSymbols: true,
                    RequireUppercase: true
                }
            }
        });
    };
    ResourceFactory.prototype.makeUserPoolNativeClient = function () {
        return new cognito_1.default.UserPoolClient({
            ClientName: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.UserPoolMobileClientName),
            UserPoolId: cloudform_1.Fn.Ref(ResourceFactory.UserPoolLogicalID),
            GenerateSecret: true,
            RefreshTokenValidity: 30
        });
    };
    ResourceFactory.prototype.makeUserPoolJSClient = function () {
        return new cognito_1.default.UserPoolClient({
            ClientName: cloudform_1.Fn.Ref(ResourceFactory.ParameterIds.UserPoolJSClientName),
            UserPoolId: cloudform_1.Fn.Ref(ResourceFactory.UserPoolLogicalID),
            GenerateSecret: false,
            RefreshTokenValidity: 30
        });
    };
    // Resources
    ResourceFactory.UserPoolLogicalID = 'UserPool';
    ResourceFactory.UserPoolNativeClientLogicalID = 'UserPoolNativeClient';
    ResourceFactory.UserPoolJSClientLogicalID = 'UserPoolJSClient';
    // Outputs
    ResourceFactory.UserPoolNativeClientOutput = 'UserPoolNativeClientId';
    ResourceFactory.UserPoolJSClientOutput = 'UserPoolJSClientId';
    ResourceFactory.ParameterIds = {
        UserPoolName: 'UserPoolName',
        UserPoolMobileClientName: 'UserPoolMobileClientName',
        UserPoolJSClientName: 'UserPoolJSClientName',
    };
    return ResourceFactory;
}());
exports.ResourceFactory = ResourceFactory;
//# sourceMappingURL=resources.js.map