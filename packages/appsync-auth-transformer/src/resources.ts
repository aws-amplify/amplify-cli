import AppSync from 'cloudform/types/appSync'
import Template from 'cloudform/types/template'
import Cognito from 'cloudform/types/cognito'
import Output from 'cloudform/types/output'
import { Fn, StringParameter, Refs } from 'cloudform'
import {
    DynamoDBMappingTemplate, ElasticSearchMappingTemplate,
    print, str, ref, obj, set, iff, ifElse, list, raw,
    forEach, compoundExpression, qref, toJson
} from 'appsync-mapping-template'

export class ResourceFactory {

    // Resources
    public static UserPoolLogicalID = 'UserPool'
    public static UserPoolNativeClientLogicalID = 'UserPoolNativeClient'
    public static UserPoolJSClientLogicalID = 'UserPoolJSClient'

    // Outputs
    public static UserPoolNativeClientOutput = 'UserPoolNativeClientId'
    public static UserPoolJSClientOutput = 'UserPoolJSClientId'

    public static ParameterIds = {
        UserPoolName: 'UserPoolName',
        UserPoolMobileClientName: 'UserPoolMobileClientName',
        UserPoolJSClientName: 'UserPoolJSClientName',
    }

    public makeParams() {
        return {
            [ResourceFactory.ParameterIds.UserPoolName]: new StringParameter({
                Description: 'The name of the AppSync API',
                Default: 'AppSyncUserPool'
            }),
            [ResourceFactory.ParameterIds.UserPoolMobileClientName]: new StringParameter({
                Description: 'The name of the native user pool client.',
                Default: 'CognitoNativeClient'
            }),
            [ResourceFactory.ParameterIds.UserPoolJSClientName]: new StringParameter({
                Description: 'The name of the web user pool client.',
                Default: 'CognitoJSClient'
            })
        }
    }

    /**
     * Creates the barebones template for an application.
     */
    public initTemplate(): Template {
        return {
            Parameters: this.makeParams(),
            Resources: {
                [ResourceFactory.UserPoolLogicalID]: this.makeUserPool(),
                [ResourceFactory.UserPoolNativeClientLogicalID]: this.makeUserPoolNativeClient(),
                [ResourceFactory.UserPoolJSClientLogicalID]: this.makeUserPoolJSClient(),
            },
            Outputs: {
                [ResourceFactory.UserPoolNativeClientOutput]: this.makeNativeClientOutput(),
                [ResourceFactory.UserPoolJSClientOutput]: this.makeJSClientOutput()
            }
        }
    }

    /**
     * Outputs
     */
    public makeNativeClientOutput(): Output {
        return {
            Description: "Amazon Cognito UserPools native client ID",
            Value: Fn.Ref(ResourceFactory.UserPoolNativeClientLogicalID),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "CognitoNativeClient"])
            }
        }
    }

    public makeJSClientOutput(): Output {
        return {
            Description: "Amazon Cognito UserPools JS client ID",
            Value: Fn.Ref(ResourceFactory.UserPoolNativeClientLogicalID),
            Export: {
                Name: Fn.Join(':', [Refs.StackName, "CognitoJSClient"])
            }
        }
    }

    /**
     * Create the AppSync API.
     */
    public makeUserPool() {
        return new Cognito.UserPool({
            AliasAttributes: ['email'],
            UserPoolName: Fn.Ref(ResourceFactory.ParameterIds.UserPoolName),
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
        })
    }

    public makeUserPoolNativeClient() {
        return new Cognito.UserPoolClient({
            ClientName: Fn.Ref(ResourceFactory.ParameterIds.UserPoolMobileClientName),
            UserPoolId: Fn.Ref(ResourceFactory.UserPoolLogicalID),
            GenerateSecret: true,
            RefreshTokenValidity: 30
        })
    }

    public makeUserPoolJSClient() {
        return new Cognito.UserPoolClient({
            ClientName: Fn.Ref(ResourceFactory.ParameterIds.UserPoolJSClientName),
            UserPoolId: Fn.Ref(ResourceFactory.UserPoolLogicalID),
            GenerateSecret: false,
            RefreshTokenValidity: 30
        })
    }
}
