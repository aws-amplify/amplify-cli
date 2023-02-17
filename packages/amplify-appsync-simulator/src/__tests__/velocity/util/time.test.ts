import { time as Time } from '../../../velocity/util/time';
import { map as valueMap } from '../../../velocity/value-mapper/mapper';

describe('Velocity $context.util.time', () => {
  let dateNowSpy;
  let time;
  const FORMAT_CUSTOM_ZONED = 'yyyy-MM-dd HH:mm:ss.SSS Z';
  const FORMAT_CUSTOM_UNZONED = 'yyyy-MM-dd HH:mm:ss.SSS';
  const TEST_TIMESTAMP_MILLIS = 1267378472045; // 2010-02-28T17:34:32.045Z
  const TEST_TIMESTAMP_SECS = 1267378472;
  const TEST_TIMESTAMP_ZULU = '2010-02-28T17:34:32.045Z';
  const TEST_TIMESTAMP_PLUS8 = '2010-03-01T01:34:32.045+08:00';
  const TEST_TIMESTAMP_CUSTOM_UTC = '2010-02-28 17:34:32.045 +0000';
  const TEST_TIMESTAMP_CUSTOM_PLUS8 = '2010-03-01 01:34:32.045 +0800';
  const TEST_TIMESTAMP_CUSTOM_UTC_UNZONED = '2010-02-28 17:34:32.045';
  const TEST_TIMESTAMP_CUSTOM_PLUS8_UNZONED = '2010-03-01 01:34:32.045';

  beforeAll(() => {
    // freeze time
    time = Time();
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => TEST_TIMESTAMP_MILLIS);
  });
  afterAll(() => {
    // unfreeze time
    dateNowSpy.mockRestore();
  });

  it('nowISO8601', () => {
    expect(time.nowISO8601()).toEqual(TEST_TIMESTAMP_ZULU);
  });

  it('nowEpochSeconds', () => {
    expect(time.nowEpochSeconds()).toEqual(TEST_TIMESTAMP_SECS);
  });

  it('nowEpochMilliSeconds', () => {
    expect(time.nowEpochMilliSeconds()).toEqual(TEST_TIMESTAMP_MILLIS);
  });

  describe('nowFormatted', () => {
    it('should format with JavaScript parameters correctly', () => {
      expect(time.nowFormatted(FORMAT_CUSTOM_ZONED, 'Australia/Perth')).toEqual(TEST_TIMESTAMP_CUSTOM_PLUS8);
    });

    it('should format with Java parameters correctly', () => {
      expect(time.nowFormatted(valueMap(FORMAT_CUSTOM_ZONED), valueMap('Australia/Perth'))).toEqual(TEST_TIMESTAMP_CUSTOM_PLUS8);
    });
  });

  describe('parseFormattedToEpochMilliSeconds', () => {
    it('should return null with null parameters', () => {
      expect(time.parseFormattedToEpochMilliSeconds(null, null)).toBeNull();
    });

    it('should parse JavaScript parameters correctly', () => {
      expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_UTC, FORMAT_CUSTOM_ZONED)).toEqual(TEST_TIMESTAMP_MILLIS);
      expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_PLUS8, FORMAT_CUSTOM_ZONED)).toEqual(TEST_TIMESTAMP_MILLIS);
      expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_UTC, FORMAT_CUSTOM_ZONED)).toEqual(TEST_TIMESTAMP_MILLIS);
      expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_PLUS8, FORMAT_CUSTOM_ZONED, 'Australia/Perth')).toEqual(
        TEST_TIMESTAMP_MILLIS,
      );
      expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_UTC_UNZONED, FORMAT_CUSTOM_UNZONED, 'UTC')).toEqual(
        TEST_TIMESTAMP_MILLIS,
      );

      expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_PLUS8_UNZONED, FORMAT_CUSTOM_UNZONED, 'Australia/Perth')).toEqual(
        TEST_TIMESTAMP_MILLIS,
      );
    });
    it('should parse Java parameters correctly', () => {
      expect(time.parseFormattedToEpochMilliSeconds(valueMap(TEST_TIMESTAMP_CUSTOM_UTC), valueMap(FORMAT_CUSTOM_ZONED))).toEqual(
        TEST_TIMESTAMP_MILLIS,
      );
      expect(time.parseFormattedToEpochMilliSeconds(valueMap(TEST_TIMESTAMP_CUSTOM_PLUS8), valueMap(FORMAT_CUSTOM_ZONED))).toEqual(
        TEST_TIMESTAMP_MILLIS,
      );
      expect(time.parseFormattedToEpochMilliSeconds(valueMap(TEST_TIMESTAMP_CUSTOM_UTC), valueMap(FORMAT_CUSTOM_ZONED))).toEqual(
        TEST_TIMESTAMP_MILLIS,
      );
      expect(
        time.parseFormattedToEpochMilliSeconds(
          valueMap(TEST_TIMESTAMP_CUSTOM_PLUS8),
          valueMap(FORMAT_CUSTOM_ZONED),
          valueMap('Australia/Perth'),
        ),
      ).toEqual(TEST_TIMESTAMP_MILLIS);
      expect(
        time.parseFormattedToEpochMilliSeconds(
          valueMap(TEST_TIMESTAMP_CUSTOM_UTC_UNZONED),
          valueMap(FORMAT_CUSTOM_UNZONED),
          valueMap('UTC'),
        ),
      ).toEqual(TEST_TIMESTAMP_MILLIS);

      expect(
        time.parseFormattedToEpochMilliSeconds(
          valueMap(TEST_TIMESTAMP_CUSTOM_PLUS8_UNZONED),
          valueMap(FORMAT_CUSTOM_UNZONED),
          valueMap('Australia/Perth'),
        ),
      ).toEqual(TEST_TIMESTAMP_MILLIS);
    });
  });

  describe('parseISO8601ToEpochMilliSeconds', () => {
    it('should parse JavaScript parameters correctly', () => {
      expect(time.parseISO8601ToEpochMilliSeconds(TEST_TIMESTAMP_ZULU)).toEqual(TEST_TIMESTAMP_MILLIS);
      expect(time.parseISO8601ToEpochMilliSeconds(TEST_TIMESTAMP_PLUS8)).toEqual(TEST_TIMESTAMP_MILLIS);
    });
    it('should parse Java parameters correctly', () => {
      expect(time.parseISO8601ToEpochMilliSeconds(valueMap(TEST_TIMESTAMP_ZULU))).toEqual(TEST_TIMESTAMP_MILLIS);
      expect(time.parseISO8601ToEpochMilliSeconds(valueMap(TEST_TIMESTAMP_PLUS8))).toEqual(TEST_TIMESTAMP_MILLIS);
    });
  });

  describe('epochMilliSecondsToSeconds', () => {
    it('should convert JavaScript parameters correctly', () => {
      expect(time.epochMilliSecondsToSeconds(TEST_TIMESTAMP_MILLIS)).toEqual(TEST_TIMESTAMP_SECS);
    });
    it('should convert Java parameters correctly', () => {
      expect(time.epochMilliSecondsToSeconds(valueMap(TEST_TIMESTAMP_MILLIS))).toEqual(TEST_TIMESTAMP_SECS);
    });
  });

  describe('epochMilliSecondsToISO8601', () => {
    it('should convert JavaScript parameters to the correct ISO8601 string', () => {
      expect(time.epochMilliSecondsToISO8601(TEST_TIMESTAMP_MILLIS)).toEqual(TEST_TIMESTAMP_ZULU);
    });
    it('should convert Java parameters to the correct ISO8601 string', () => {
      expect(time.epochMilliSecondsToISO8601(valueMap(TEST_TIMESTAMP_MILLIS))).toEqual(TEST_TIMESTAMP_ZULU);
    });
  });

  describe('epochMilliSecondsToFormatted', () => {
    it('should convert JavaScript parameters to the correct formatted string', () => {
      expect(time.epochMilliSecondsToFormatted(TEST_TIMESTAMP_MILLIS, FORMAT_CUSTOM_ZONED)).toEqual(TEST_TIMESTAMP_CUSTOM_UTC);
      expect(time.epochMilliSecondsToFormatted(TEST_TIMESTAMP_MILLIS, FORMAT_CUSTOM_ZONED, 'Australia/Perth')).toEqual(
        TEST_TIMESTAMP_CUSTOM_PLUS8,
      );
    });
    it('should convert Java parameters to the correct formatted string', () => {
      expect(time.epochMilliSecondsToFormatted(valueMap(TEST_TIMESTAMP_MILLIS), valueMap(FORMAT_CUSTOM_ZONED))).toEqual(
        TEST_TIMESTAMP_CUSTOM_UTC,
      );
      expect(
        time.epochMilliSecondsToFormatted(valueMap(TEST_TIMESTAMP_MILLIS), valueMap(FORMAT_CUSTOM_ZONED), valueMap('Australia/Perth')),
      ).toEqual(TEST_TIMESTAMP_CUSTOM_PLUS8);
    });
  });
});
