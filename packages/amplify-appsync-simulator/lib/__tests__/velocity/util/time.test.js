"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const time_1 = require("../../../velocity/util/time");
const mapper_1 = require("../../../velocity/value-mapper/mapper");
describe('Velocity $context.util.time', () => {
    let dateNowSpy;
    let time;
    const FORMAT_CUSTOM_ZONED = 'yyyy-MM-dd HH:mm:ss.SSS Z';
    const FORMAT_CUSTOM_UNZONED = 'yyyy-MM-dd HH:mm:ss.SSS';
    const TEST_TIMESTAMP_MILLIS = 1267378472045;
    const TEST_TIMESTAMP_SECS = 1267378472;
    const TEST_TIMESTAMP_ZULU = '2010-02-28T17:34:32.045Z';
    const TEST_TIMESTAMP_PLUS8 = '2010-03-01T01:34:32.045+08:00';
    const TEST_TIMESTAMP_CUSTOM_UTC = '2010-02-28 17:34:32.045 +0000';
    const TEST_TIMESTAMP_CUSTOM_PLUS8 = '2010-03-01 01:34:32.045 +0800';
    const TEST_TIMESTAMP_CUSTOM_UTC_UNZONED = '2010-02-28 17:34:32.045';
    const TEST_TIMESTAMP_CUSTOM_PLUS8_UNZONED = '2010-03-01 01:34:32.045';
    beforeAll(() => {
        time = (0, time_1.time)();
        dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => TEST_TIMESTAMP_MILLIS);
    });
    afterAll(() => {
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
            expect(time.nowFormatted((0, mapper_1.map)(FORMAT_CUSTOM_ZONED), (0, mapper_1.map)('Australia/Perth'))).toEqual(TEST_TIMESTAMP_CUSTOM_PLUS8);
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
            expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_PLUS8, FORMAT_CUSTOM_ZONED, 'Australia/Perth')).toEqual(TEST_TIMESTAMP_MILLIS);
            expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_UTC_UNZONED, FORMAT_CUSTOM_UNZONED, 'UTC')).toEqual(TEST_TIMESTAMP_MILLIS);
            expect(time.parseFormattedToEpochMilliSeconds(TEST_TIMESTAMP_CUSTOM_PLUS8_UNZONED, FORMAT_CUSTOM_UNZONED, 'Australia/Perth')).toEqual(TEST_TIMESTAMP_MILLIS);
        });
        it('should parse Java parameters correctly', () => {
            expect(time.parseFormattedToEpochMilliSeconds((0, mapper_1.map)(TEST_TIMESTAMP_CUSTOM_UTC), (0, mapper_1.map)(FORMAT_CUSTOM_ZONED))).toEqual(TEST_TIMESTAMP_MILLIS);
            expect(time.parseFormattedToEpochMilliSeconds((0, mapper_1.map)(TEST_TIMESTAMP_CUSTOM_PLUS8), (0, mapper_1.map)(FORMAT_CUSTOM_ZONED))).toEqual(TEST_TIMESTAMP_MILLIS);
            expect(time.parseFormattedToEpochMilliSeconds((0, mapper_1.map)(TEST_TIMESTAMP_CUSTOM_UTC), (0, mapper_1.map)(FORMAT_CUSTOM_ZONED))).toEqual(TEST_TIMESTAMP_MILLIS);
            expect(time.parseFormattedToEpochMilliSeconds((0, mapper_1.map)(TEST_TIMESTAMP_CUSTOM_PLUS8), (0, mapper_1.map)(FORMAT_CUSTOM_ZONED), (0, mapper_1.map)('Australia/Perth'))).toEqual(TEST_TIMESTAMP_MILLIS);
            expect(time.parseFormattedToEpochMilliSeconds((0, mapper_1.map)(TEST_TIMESTAMP_CUSTOM_UTC_UNZONED), (0, mapper_1.map)(FORMAT_CUSTOM_UNZONED), (0, mapper_1.map)('UTC'))).toEqual(TEST_TIMESTAMP_MILLIS);
            expect(time.parseFormattedToEpochMilliSeconds((0, mapper_1.map)(TEST_TIMESTAMP_CUSTOM_PLUS8_UNZONED), (0, mapper_1.map)(FORMAT_CUSTOM_UNZONED), (0, mapper_1.map)('Australia/Perth'))).toEqual(TEST_TIMESTAMP_MILLIS);
        });
    });
    describe('parseISO8601ToEpochMilliSeconds', () => {
        it('should parse JavaScript parameters correctly', () => {
            expect(time.parseISO8601ToEpochMilliSeconds(TEST_TIMESTAMP_ZULU)).toEqual(TEST_TIMESTAMP_MILLIS);
            expect(time.parseISO8601ToEpochMilliSeconds(TEST_TIMESTAMP_PLUS8)).toEqual(TEST_TIMESTAMP_MILLIS);
        });
        it('should parse Java parameters correctly', () => {
            expect(time.parseISO8601ToEpochMilliSeconds((0, mapper_1.map)(TEST_TIMESTAMP_ZULU))).toEqual(TEST_TIMESTAMP_MILLIS);
            expect(time.parseISO8601ToEpochMilliSeconds((0, mapper_1.map)(TEST_TIMESTAMP_PLUS8))).toEqual(TEST_TIMESTAMP_MILLIS);
        });
    });
    describe('epochMilliSecondsToSeconds', () => {
        it('should convert JavaScript parameters correctly', () => {
            expect(time.epochMilliSecondsToSeconds(TEST_TIMESTAMP_MILLIS)).toEqual(TEST_TIMESTAMP_SECS);
        });
        it('should convert Java parameters correctly', () => {
            expect(time.epochMilliSecondsToSeconds((0, mapper_1.map)(TEST_TIMESTAMP_MILLIS))).toEqual(TEST_TIMESTAMP_SECS);
        });
    });
    describe('epochMilliSecondsToISO8601', () => {
        it('should convert JavaScript parameters to the correct ISO8601 string', () => {
            expect(time.epochMilliSecondsToISO8601(TEST_TIMESTAMP_MILLIS)).toEqual(TEST_TIMESTAMP_ZULU);
        });
        it('should convert Java parameters to the correct ISO8601 string', () => {
            expect(time.epochMilliSecondsToISO8601((0, mapper_1.map)(TEST_TIMESTAMP_MILLIS))).toEqual(TEST_TIMESTAMP_ZULU);
        });
    });
    describe('epochMilliSecondsToFormatted', () => {
        it('should convert JavaScript parameters to the correct formatted string', () => {
            expect(time.epochMilliSecondsToFormatted(TEST_TIMESTAMP_MILLIS, FORMAT_CUSTOM_ZONED)).toEqual(TEST_TIMESTAMP_CUSTOM_UTC);
            expect(time.epochMilliSecondsToFormatted(TEST_TIMESTAMP_MILLIS, FORMAT_CUSTOM_ZONED, 'Australia/Perth')).toEqual(TEST_TIMESTAMP_CUSTOM_PLUS8);
        });
        it('should convert Java parameters to the correct formatted string', () => {
            expect(time.epochMilliSecondsToFormatted((0, mapper_1.map)(TEST_TIMESTAMP_MILLIS), (0, mapper_1.map)(FORMAT_CUSTOM_ZONED))).toEqual(TEST_TIMESTAMP_CUSTOM_UTC);
            expect(time.epochMilliSecondsToFormatted((0, mapper_1.map)(TEST_TIMESTAMP_MILLIS), (0, mapper_1.map)(FORMAT_CUSTOM_ZONED), (0, mapper_1.map)('Australia/Perth'))).toEqual(TEST_TIMESTAMP_CUSTOM_PLUS8);
        });
    });
});
//# sourceMappingURL=time.test.js.map