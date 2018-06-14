"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class NotificationWithSubscribers {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.NotificationWithSubscribers = NotificationWithSubscribers;
class Subscriber {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Subscriber = Subscriber;
class Notification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Notification = Notification;
class BudgetData {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.BudgetData = BudgetData;
class CostTypes {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.CostTypes = CostTypes;
class TimePeriod {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.TimePeriod = TimePeriod;
class Spend {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Spend = Spend;
class Budget extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Budgets::Budget', properties);
    }
}
Budget.NotificationWithSubscribers = NotificationWithSubscribers;
Budget.Subscriber = Subscriber;
Budget.Notification = Notification;
Budget.BudgetData = BudgetData;
Budget.CostTypes = CostTypes;
Budget.TimePeriod = TimePeriod;
Budget.Spend = Spend;
exports.default = Budget;
