import * as moment from 'moment';
import 'moment-timezone';
import 'moment-jdateformatparser';

declare module 'moment' {
  export interface Moment {
    toMomentFormatString: (format: string) => string;
    formatWithJDF: (format: string) => string;
  }
}

const parseTimestamp = (dateTime: string, format?: string, timezone?: string): moment.Moment => {
  if (!dateTime || !format) {
    return null;
  }
  try {
    const momentFormatString = moment().toMomentFormatString(format);

    return timezone ? moment.tz(dateTime, momentFormatString, timezone) : moment(dateTime, momentFormatString);
  } catch (e) {
    return null;
  }
};

export const time = () => ({
  nowISO8601(t): string {
    return moment().toISOString();
  },
  nowEpochSeconds(): number {
    return moment().unix();
  },
  nowEpochMilliSeconds(): number {
    return moment().valueOf();
  },
  nowFormatted(format: string, timezone: string = null): string | null {
    try {
      if (timezone) {
        return moment()
          .tz(timezone)
          .formatWithJDF(format);
      }

      return moment().formatWithJDF(format);
    } catch (e) {
      return null;
    }
  },
  parseFormattedToEpochMilliSeconds(dateTime: string, format: string, timezone?: string): number | null {
    const timestamp = parseTimestamp(dateTime, format, timezone);
    return timestamp ? timestamp.valueOf() : null;
  },
  parseISO8601ToEpochMilliSeconds(dateTime): number | null {
    const timestamp = parseTimestamp(dateTime, 'YYYY-MM-DDTHH:mm:ss.SZ');
    return timestamp ? timestamp.valueOf() : null;
  },
  epochMilliSecondsToSeconds(milliseconds: number): number | null {
    try {
      return Math.floor(milliseconds / 1000);
    } catch (e) {
      return null;
    }
  },
  epochMilliSecondsToISO8601(dateTime: number): string | null {
    try {
      return moment(dateTime).toISOString();
    } catch (e) {
      return null;
    }
  },
  epochMilliSecondsToFormatted(timestamp: number, format: string, timezone: string = 'UTC'): string | null {
    try {
      return moment(timestamp)
        .tz(timezone)
        .formatWithJDF(format);
    } catch (e) {
      return null;
    }
  },
});
