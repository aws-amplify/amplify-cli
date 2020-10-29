let DEFAULT_INTERVAL = ['*'];
/**
 * Initializes a CronBuilder with an optional initial cron expression.
 * @constructor
 */
export class CronBuilder {
  initialExpression: any;
  constructor() {
    this.initialExpression = {
      minute: DEFAULT_INTERVAL,
      hour: DEFAULT_INTERVAL,
      dayOfTheMonth: DEFAULT_INTERVAL,
      month: DEFAULT_INTERVAL,
      dayOfTheWeek: DEFAULT_INTERVAL,
    };
  }

  /**
   * builds a working cron expression based on the state of the cron object
   * @returns {string} - working cron expression
   */
  build() {
    return [
      this.initialExpression.minute.join(','),
      this.initialExpression.hour.join(','),
      this.initialExpression.dayOfTheMonth.join(','),
      this.initialExpression.month.join(','),
      this.initialExpression.dayOfTheWeek.join(','),
    ].join(' ');
  }

  /**
   * returns the current state of a given measureOfTime
   * @param {!string} measureOfTime one of "minute", "hour", etc
   * @returns {!string} comma separated blah blah
   */
  get = function(measureOfTime) {
    return this.initialExpression[measureOfTime].join(',');
  };

  /**
   * sets the state of a given measureOfTime
   * @param {!string} measureOfTime - yup
   * @param {!Array.<string>} value - the 5 tuple array of values to set
   * @returns {!string} the comma separated version of the value that you passed in
   * @throws {Error} if your "value" is not an Array&lt;String&gt;
   */
  set = function(measureOfTime, value) {
    if (!Array.isArray(value)) {
      throw new Error('Invalid value; Value must be in the form of an Array.');
    }
    this.initialExpression[measureOfTime] = value;
    return this.initialExpression[measureOfTime].join(',');
  };
}
