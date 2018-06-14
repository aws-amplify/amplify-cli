/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class NotificationWithSubscribers {
    Subscribers: List<Subscriber>
    Notification: Notification

    constructor(properties: NotificationWithSubscribers) {
        Object.assign(this, properties)
    }
}

export class Subscriber {
    SubscriptionType: Value<string>
    Address: Value<string>

    constructor(properties: Subscriber) {
        Object.assign(this, properties)
    }
}

export class Notification {
    ComparisonOperator: Value<string>
    NotificationType: Value<string>
    Threshold: Value<number>
    ThresholdType?: Value<string>

    constructor(properties: Notification) {
        Object.assign(this, properties)
    }
}

export class BudgetData {
    BudgetLimit?: Spend
    TimePeriod?: TimePeriod
    TimeUnit: Value<string>
    CostFilters?: any
    BudgetName?: Value<string>
    CostTypes?: CostTypes
    BudgetType: Value<string>

    constructor(properties: BudgetData) {
        Object.assign(this, properties)
    }
}

export class CostTypes {
    IncludeSupport?: Value<boolean>
    IncludeOtherSubscription?: Value<boolean>
    IncludeTax?: Value<boolean>
    IncludeSubscription?: Value<boolean>
    UseBlended?: Value<boolean>
    IncludeUpfront?: Value<boolean>
    IncludeDiscount?: Value<boolean>
    IncludeCredit?: Value<boolean>
    IncludeRecurring?: Value<boolean>
    UseAmortized?: Value<boolean>
    IncludeRefund?: Value<boolean>

    constructor(properties: CostTypes) {
        Object.assign(this, properties)
    }
}

export class TimePeriod {
    Start?: Value<string>
    End?: Value<string>

    constructor(properties: TimePeriod) {
        Object.assign(this, properties)
    }
}

export class Spend {
    Amount: Value<number>
    Unit: Value<string>

    constructor(properties: Spend) {
        Object.assign(this, properties)
    }
}

export interface BudgetProperties {
    NotificationsWithSubscribers?: List<NotificationWithSubscribers>
    Budget: BudgetData
}

export default class Budget extends ResourceBase {
    static NotificationWithSubscribers = NotificationWithSubscribers
    static Subscriber = Subscriber
    static Notification = Notification
    static BudgetData = BudgetData
    static CostTypes = CostTypes
    static TimePeriod = TimePeriod
    static Spend = Spend

    constructor(properties?: BudgetProperties) {
        super('AWS::Budgets::Budget', properties)
    }
}
