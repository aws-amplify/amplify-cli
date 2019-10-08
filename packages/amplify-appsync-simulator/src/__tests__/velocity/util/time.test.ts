import { time as Time } from '../../../velocity/util/time';

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

  it('parseFormattedToEpochMilliSeconds', () => {
    expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_UTC, FORMAT_CUSTOM_ZONED)).toEqual(TEST_TIMESTAMP_MILLIS);
    expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_PLUS8, FORMAT_CUSTOM_ZONED)).toEqual(TEST_TIMESTAMP_MILLIS);
    expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_UTC, FORMAT_CUSTOM_ZONED)).toEqual(TEST_TIMESTAMP_MILLIS);
    expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_PLUS8, FORMAT_CUSTOM_ZONED, 'Australia/Perth')).toEqual(
      TEST_TIMESTAMP_MILLIS
    );
    expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_UTC_UNZONED, FORMAT_CUSTOM_UNZONED, 'UTC')).toEqual(
      TEST_TIMESTAMP_MILLIS
    );

    expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_PLUS8_UNZONED, FORMAT_CUSTOM_UNZONED, 'Australia/Perth')).toEqual(
      TEST_TIMESTAMP_MILLIS
    );
  });

  it('parseISO8601ToEpochMilliSeconds', () => {
    expect(time.parseISO8601ToEpochMilliSeconds(TEST_TIMESTAMP_ZULU)).toEqual(TEST_TIMESTAMP_MILLIS);
    expect(time.parseISO8601ToEpochMilliSeconds(TEST_TIMESTAMP_PLUS8)).toEqual(TEST_TIMESTAMP_MILLIS);
  });
  it('epochMilliSecondsToSeconds', () => {
    expect(time.epochMilliSecondsToSeconds(TEST_TIMESTAMP_MILLIS)).toEqual(TEST_TIMESTAMP_SECS);
  });
  it('epochMilliSecondsToISO8601', () => {
    expect(time.epochMilliSecondsToISO8601(TEST_TIMESTAMP_MILLIS)).toEqual(TEST_TIMESTAMP_ZULU);
  });

  it('epochMilliSecondsToFormatted', () => {
    expect(time.epochMilliSecondsToFormatted(TEST_TIMESTAMP_MILLIS, FORMAT_CUSTOM_ZONED)).toEqual(TEST_TIMESTAMP_CUSTOM_UTC);

    expect(time.epochMilliSecondsToFormatted(TEST_TIMESTAMP_MILLIS, FORMAT_CUSTOM_ZONED, 'Australia/Perth')).toEqual(
      TEST_TIMESTAMP_CUSTOM_PLUS8
    );
  });
});
