import * as dateformat from 'dateformat';

export const time = now => ({
  nowISO8601() {
    return now.toISOString();
  },
  nowEpochSeconds() {
    return parseInt((now.valueOf() / 1000).toString(), 10);
  },
  nowEpochMilliSeconds() {
    return now.valueOf();
  },
  nowFormatted(format, timezone = null) {
    if (timezone) throw new Error('no support for setting timezone!');
    return dateformat(now, format);
  },
  parseFormattedToEpochMilliSeconds() {
    throw new Error('not implemented');
  },
  parseISO8601ToEpochMilliSeconds() {
    throw new Error('not implemented');
  },
  epochMilliSecondsToSeconds() {
    throw new Error('not implemented');
  },
  epochMilliSecondsToISO8601() {
    throw new Error('not implemented');
  },
  epochMilliSecondsToFormatted() {
    throw new Error('not implemented');
  },
});
