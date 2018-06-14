/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class PushSync {
    ApplicationArns?: List<Value<string>>
    RoleArn?: Value<string>

    constructor(properties: PushSync) {
        Object.assign(this, properties)
    }
}

export class CognitoIdentityProvider {
    ServerSideTokenCheck?: Value<boolean>
    ProviderName?: Value<string>
    ClientId?: Value<string>

    constructor(properties: CognitoIdentityProvider) {
        Object.assign(this, properties)
    }
}

export class CognitoStreams {
    StreamingStatus?: Value<string>
    StreamName?: Value<string>
    RoleArn?: Value<string>

    constructor(properties: CognitoStreams) {
        Object.assign(this, properties)
    }
}

export interface IdentityPoolProperties {
    PushSync?: PushSync
    CognitoIdentityProviders?: List<CognitoIdentityProvider>
    CognitoEvents?: any
    DeveloperProviderName?: Value<string>
    CognitoStreams?: CognitoStreams
    IdentityPoolName?: Value<string>
    AllowUnauthenticatedIdentities: Value<boolean>
    SupportedLoginProviders?: any
    SamlProviderARNs?: List<Value<string>>
    OpenIdConnectProviderARNs?: List<Value<string>>
}

export default class IdentityPool extends ResourceBase {
    static PushSync = PushSync
    static CognitoIdentityProvider = CognitoIdentityProvider
    static CognitoStreams = CognitoStreams

    constructor(properties?: IdentityPoolProperties) {
        super('AWS::Cognito::IdentityPool', properties)
    }
}
