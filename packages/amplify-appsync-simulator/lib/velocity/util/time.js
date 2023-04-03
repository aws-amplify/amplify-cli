"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.time = void 0;
const moment_1 = __importDefault(require("moment"));
require("moment-timezone");
require("moment-jdateformatparser");
const to_json_1 = require("../value-mapper/to-json");
const parseTimestamp = (dateTime, format, timezone) => {
    if (!dateTime || !format) {
        return null;
    }
    try {
        const momentFormatString = (0, moment_1.default)().toMomentFormatString(format);
        return timezone ? moment_1.default.tz(dateTime, momentFormatString, timezone) : (0, moment_1.default)(dateTime, momentFormatString);
    }
    catch (e) {
        return null;
    }
};
const time = () => ({
    nowISO8601() {
        return (0, moment_1.default)().toISOString();
    },
    nowEpochSeconds() {
        return (0, moment_1.default)().unix();
    },
    nowEpochMilliSeconds() {
        return (0, moment_1.default)().valueOf();
    },
    nowFormatted(format, timezone = null) {
        const jsonFormat = (0, to_json_1.toJSON)(format);
        const jsonTimezone = (0, to_json_1.toJSON)(timezone);
        try {
            if (jsonTimezone) {
                return (0, moment_1.default)().tz(jsonTimezone).formatWithJDF(jsonFormat);
            }
            return (0, moment_1.default)().formatWithJDF(jsonFormat);
        }
        catch (e) {
            return null;
        }
    },
    parseFormattedToEpochMilliSeconds(dateTime, format, timezone) {
        const jsonDateTime = (0, to_json_1.toJSON)(dateTime);
        const jsonFormat = (0, to_json_1.toJSON)(format);
        const jsonTimezone = (0, to_json_1.toJSON)(timezone);
        const timestamp = parseTimestamp(jsonDateTime, jsonFormat, jsonTimezone);
        return timestamp ? timestamp.valueOf() : null;
    },
    parseISO8601ToEpochMilliSeconds(dateTime) {
        const jsonDateTime = (0, to_json_1.toJSON)(dateTime);
        const timestamp = parseTimestamp(jsonDateTime, 'YYYY-MM-DDTHH:mm:ss.SZ');
        return timestamp ? timestamp.valueOf() : null;
    },
    epochMilliSecondsToSeconds(milliseconds) {
        const jsonMilliseconds = (0, to_json_1.toJSON)(milliseconds);
        try {
            return Math.floor(jsonMilliseconds / 1000);
        }
        catch (e) {
            return null;
        }
    },
    epochMilliSecondsToISO8601(dateTime) {
        const jsonDateTime = (0, to_json_1.toJSON)(dateTime);
        try {
            return (0, moment_1.default)(jsonDateTime).toISOString();
        }
        catch (e) {
            return null;
        }
    },
    epochMilliSecondsToFormatted(timestamp, format, timezone = 'UTC') {
        const jsonTimestamp = (0, to_json_1.toJSON)(timestamp);
        const jsonFormat = (0, to_json_1.toJSON)(format);
        const jsonTimezone = (0, to_json_1.toJSON)(timezone);
        try {
            return (0, moment_1.default)(jsonTimestamp).tz(jsonTimezone).formatWithJDF(jsonFormat);
        }
        catch (e) {
            return null;
        }
    },
});
exports.time = time;
//# sourceMappingURL=time.js.map