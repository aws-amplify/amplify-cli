/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class BounceAction {
    Sender: Value<string>
    SmtpReplyCode: Value<string>
    Message: Value<string>
    TopicArn?: Value<string>
    StatusCode?: Value<string>

    constructor(properties: BounceAction) {
        Object.assign(this, properties)
    }
}

export class WorkmailAction {
    TopicArn?: Value<string>
    OrganizationArn: Value<string>

    constructor(properties: WorkmailAction) {
        Object.assign(this, properties)
    }
}

export class StopAction {
    Scope: Value<string>
    TopicArn?: Value<string>

    constructor(properties: StopAction) {
        Object.assign(this, properties)
    }
}

export class Action {
    BounceAction?: BounceAction
    S3Action?: S3Action
    StopAction?: StopAction
    SNSAction?: SNSAction
    WorkmailAction?: WorkmailAction
    AddHeaderAction?: AddHeaderAction
    LambdaAction?: LambdaAction

    constructor(properties: Action) {
        Object.assign(this, properties)
    }
}

export class SNSAction {
    TopicArn?: Value<string>
    Encoding?: Value<string>

    constructor(properties: SNSAction) {
        Object.assign(this, properties)
    }
}

export class Rule {
    ScanEnabled?: Value<boolean>
    Recipients?: List<Value<string>>
    Actions?: List<Action>
    Enabled?: Value<boolean>
    Name?: Value<string>
    TlsPolicy?: Value<string>

    constructor(properties: Rule) {
        Object.assign(this, properties)
    }
}

export class LambdaAction {
    FunctionArn: Value<string>
    TopicArn?: Value<string>
    InvocationType?: Value<string>

    constructor(properties: LambdaAction) {
        Object.assign(this, properties)
    }
}

export class S3Action {
    BucketName: Value<string>
    KmsKeyArn?: Value<string>
    TopicArn?: Value<string>
    ObjectKeyPrefix?: Value<string>

    constructor(properties: S3Action) {
        Object.assign(this, properties)
    }
}

export class AddHeaderAction {
    HeaderValue: Value<string>
    HeaderName: Value<string>

    constructor(properties: AddHeaderAction) {
        Object.assign(this, properties)
    }
}

export interface ReceiptRuleProperties {
    After?: Value<string>
    Rule: Rule
    RuleSetName: Value<string>
}

export default class ReceiptRule extends ResourceBase {
    static BounceAction = BounceAction
    static WorkmailAction = WorkmailAction
    static StopAction = StopAction
    static Action = Action
    static SNSAction = SNSAction
    static Rule = Rule
    static LambdaAction = LambdaAction
    static S3Action = S3Action
    static AddHeaderAction = AddHeaderAction

    constructor(properties?: ReceiptRuleProperties) {
        super('AWS::SES::ReceiptRule', properties)
    }
}
