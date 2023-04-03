"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronBuilder = void 0;
const DEFAULT_INTERVAL = ['*'];
class CronBuilder {
    constructor() {
        this.get = function (measureOfTime) {
            return this.initialExpression[measureOfTime].join(',');
        };
        this.set = function (measureOfTime, value) {
            if (!Array.isArray(value)) {
                throw new Error('Invalid value; Value must be in the form of an Array.');
            }
            this.initialExpression[measureOfTime] = value;
            return this.initialExpression[measureOfTime].join(',');
        };
        this.initialExpression = {
            minute: DEFAULT_INTERVAL,
            hour: DEFAULT_INTERVAL,
            dayOfTheMonth: DEFAULT_INTERVAL,
            month: DEFAULT_INTERVAL,
            dayOfTheWeek: DEFAULT_INTERVAL,
        };
    }
    build() {
        return [
            this.initialExpression.minute.join(','),
            this.initialExpression.hour.join(','),
            this.initialExpression.dayOfTheMonth.join(','),
            this.initialExpression.month.join(','),
            this.initialExpression.dayOfTheWeek.join(','),
        ].join(' ');
    }
}
exports.CronBuilder = CronBuilder;
//# sourceMappingURL=cronBuilder.js.map