import moment from 'moment';
import 'moment-timezone';
import 'moment-jdateformatparser';
import { toJSON } from '../value-mapper/to-json';

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
  nowISO8601(): string {
    return moment().toISOString();
  },
  nowEpochSeconds(): number {
    return moment().unix();
  },
  nowEpochMilliSeconds(): number {
    return moment().valueOf();
  },
  nowFormatted(format: string, timezone: string = null): string | null {
    const jsonFormat = toJSON(format);
    const jsonTimezone = toJSON(timezone);

    try {
      if (jsonTimezone) {
        return moment().tz(jsonTimezone).formatWithJDF(jsonFormat);
      }

      return moment().formatWithJDF(jsonFormat);
    } catch (e) {
      return null;
    }
  },
  parseFormattedToEpochMilliSeconds(dateTime: string, format: string, timezone?: string): number | null {
    const jsonDateTime = toJSON(dateTime);
    const jsonFormat = toJSON(format);
    const jsonTimezone = toJSON(timezone);

    const timestamp = parseTimestamp(jsonDateTime, jsonFormat, jsonTimezone);
    return timestamp ? timestamp.valueOf() : null;
  },
  parseISO8601ToEpochMilliSeconds(dateTime): number | null {
    const jsonDateTime = toJSON(dateTime);
    const timestamp = parseTimestamp(jsonDateTime, 'YYYY-MM-DDTHH:mm:ss.SZ');
    return timestamp ? timestamp.valueOf() : null;
  },
  epochMilliSecondsToSeconds(milliseconds: number): number | null {
    const jsonMilliseconds = toJSON(milliseconds);
    try {
      return Math.floor(jsonMilliseconds / 1000);
    } catch (e) {
      return null;
    }
  },
  epochMilliSecondsToISO8601(dateTime: number): string | null {
    const jsonDateTime = toJSON(dateTime);
    try {
      return moment(jsonDateTime).toISOString();
    } catch (e) {
      return null;
    }
  },
  epochMilliSecondsToFormatted(timestamp: number, format: string, timezone = 'UTC'): string | null {
    const jsonTimestamp = toJSON(timestamp);
    const jsonFormat = toJSON(format);
    const jsonTimezone = toJSON(timezone);

    try {
      return moment(jsonTimestamp).tz(jsonTimezone).formatWithJDF(jsonFormat);
    } catch (e) {
      return null;
    }
  },
});
