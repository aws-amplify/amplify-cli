"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const subscriptions_filter_1 = require("../../../utils/graphql-runner/subscriptions-filter");
describe('filterSubscriptions', () => {
    it('should return true if there  are no filters', () => {
        expect((0, subscriptions_filter_1.filterSubscriptions)({ a: 12 }, {})).toBeTruthy();
    });
    it('should return false if there is no payload', () => {
        expect((0, subscriptions_filter_1.filterSubscriptions)(null, {})).toBeFalsy();
    });
    it('should return true when filter matches partially', () => {
        expect((0, subscriptions_filter_1.filterSubscriptions)({ a: 1, b: 2 }, { a: 1 })).toBeTruthy();
    });
    it('should return true when filter matches completely', () => {
        expect((0, subscriptions_filter_1.filterSubscriptions)({ a: 1, b: 2 }, { a: 1, b: 2 })).toBeTruthy();
    });
    it('should return false when filter does not match', () => {
        expect((0, subscriptions_filter_1.filterSubscriptions)({ a: 1, b: 2 }, { a: 1, b: 3 })).toBeFalsy();
    });
});
//# sourceMappingURL=subscription-fiter.test.js.map