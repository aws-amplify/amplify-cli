"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronExpression = void 0;
const jstreemap_1 = require("jstreemap");
const SECOND = 0;
const MINUTE = 1;
const HOUR = 2;
const DAY_OF_MONTH = 3;
const MONTH = 4;
const DAY_OF_WEEK = 5;
const YEAR = 6;
const ALL_SPEC_INT = 99;
const NO_SPEC_INT = 98;
const monthMap = new Map();
const dayMap = new Map();
monthMap.set('JAN', 0);
monthMap.set('FEB', 1);
monthMap.set('MAR', 2);
monthMap.set('APR', 3);
monthMap.set('MAY', 4);
monthMap.set('JUN', 5);
monthMap.set('JUL', 6);
monthMap.set('AUG', 7);
monthMap.set('SEP', 8);
monthMap.set('OCT', 9);
monthMap.set('NOV', 10);
monthMap.set('DEC', 11);
dayMap.set('SUN', 1);
dayMap.set('MON', 2);
dayMap.set('TUE', 3);
dayMap.set('WED', 4);
dayMap.set('THU', 5);
dayMap.set('FRI', 6);
dayMap.set('SAT', 7);
class CronExpression {
    constructor(cronExpression) {
        this.cronExpression = null;
        this.seconds = new jstreemap_1.TreeSet();
        this.minutes = new jstreemap_1.TreeSet();
        this.hours = new jstreemap_1.TreeSet();
        this.daysOfMonth = new jstreemap_1.TreeSet();
        this.months = new jstreemap_1.TreeSet();
        this.daysOfWeek = new jstreemap_1.TreeSet();
        this.years = new jstreemap_1.TreeSet();
        this.lastDayOfWeek = false;
        this.numDayOfWeek = 0;
        this.lastDayOfMonth = false;
        this.nearestWeekday = false;
        this.expressionParsed = false;
        this.strMinutes = null;
        this.strHours = null;
        this.strWeekdays = null;
        this.strMonths = null;
        this.strDaysOfMonth = null;
        this.buildExpressionSecondOptional = function (cronExpression) {
            let parsesWithMissingSeconds = false;
            try {
                this.buildExpression('0 ' + cronExpression);
                parsesWithMissingSeconds = true;
            }
            catch (e) {
            }
            let parsesWithOriginal = false;
            this.resetState();
            try {
                this.buildExpression(cronExpression);
                parsesWithOriginal = true;
            }
            catch (e) {
                if (!parsesWithMissingSeconds) {
                    throw new Error(e);
                }
                else {
                    this.resetState();
                    this.buildExpression('0 ' + cronExpression);
                }
            }
            if (parsesWithMissingSeconds && parsesWithOriginal) {
                throw new Error('Ambiguous cron expression' + String(-1));
            }
        };
        this.buildExpression = function (cronExpression) {
            this.expressionParsed = true;
            try {
                if (this.seconds === null) {
                    this.seconds = new jstreemap_1.TreeSet();
                }
                if (this.minutes === null) {
                    this.minutes = new jstreemap_1.TreeSet();
                }
                if (this.hours === null) {
                    this.hours = new jstreemap_1.TreeSet();
                }
                if (this.daysOfMonth === null) {
                    this.daysOfMonth = new jstreemap_1.TreeSet();
                }
                if (this.months === null) {
                    this.months = new jstreemap_1.TreeSet();
                }
                if (this.daysOfWeek === null) {
                    this.daysOfWeek = new jstreemap_1.TreeSet();
                }
                if (this.years === null) {
                    this.years = new jstreemap_1.TreeSet();
                }
                let exprOn = SECOND;
                const expressionTokenizer = cronExpression.split(' ');
                let lengthExpressionTokenizer = 0;
                while (lengthExpressionTokenizer <= expressionTokenizer.length - 1 && exprOn <= YEAR) {
                    if (expressionTokenizer[lengthExpressionTokenizer] != undefined) {
                        const expr = expressionTokenizer[lengthExpressionTokenizer].trim();
                        const vTok = expr.split(',');
                        let len_vTok = 0;
                        while (len_vTok <= vTok.length - 1) {
                            if (vTok[len_vTok] != undefined) {
                                const v = vTok[len_vTok];
                                this.storeExpressionValues(0, v, exprOn);
                            }
                            len_vTok++;
                        }
                        exprOn++;
                    }
                    lengthExpressionTokenizer++;
                }
                if (exprOn <= DAY_OF_WEEK) {
                    throw new Error('Unexpected end of expression.');
                }
                if (exprOn <= YEAR) {
                    this.storeExpressionValues(0, '*', YEAR);
                }
                const dow = this.getSet(DAY_OF_WEEK);
                const dom = this.getSet(DAY_OF_MONTH);
                const dayOfMSpec = !dom.has(NO_SPEC_INT);
                const dayOfWSpec = !dow.has(NO_SPEC_INT);
                if (dayOfMSpec && !dayOfWSpec) {
                }
                else if (dayOfWSpec && !dayOfMSpec) {
                }
                else {
                    throw new Error('Specifying both a day-of-week AND a day-of-month parameter is not supported.');
                }
            }
            catch (e) {
                throw new Error(e);
            }
        };
        this.storeExpressionValues = function (pos, s, type) {
            let increment = 0;
            let i = this.skipWhiteSpace(pos, s);
            if (i >= s.length) {
                return i;
            }
            let c = s.charAt(i);
            if (c >= 'A' && c <= 'Z' && !(s === 'L') && !(s === 'LW')) {
                let sub = s.substring(i, i + 3);
                let sVal = -1;
                let eVal = -1;
                if (type === MONTH) {
                    sVal = this.getMonthNumber(sub) + 1;
                    if (sVal <= 0) {
                        throw new Error("Invalid Month value: '" + sub + "'" + String(i));
                    }
                    if (s.length > i + 3) {
                        c = s.charAt(i + 3);
                        if (c === '-') {
                            i += 4;
                            sub = s.substring(i, i + 3);
                            eVal = this.getMonthNumber(sub) + 1;
                            if (eVal <= 0) {
                                throw new Error("Invalid Month value: '" + sub + "'" + String(i));
                            }
                        }
                    }
                }
                else if (type === DAY_OF_WEEK) {
                    sVal = this.getDayOfWeekNumber(sub);
                    if (sVal < 0) {
                        throw new Error("Invalid Day-of-Week value: '" + sub + "'" + String(i));
                    }
                    if (s.length > i + 3) {
                        c = s.charAt(i + 3);
                        if (c === '-') {
                            i += 4;
                            sub = s.substring(i, i + 3);
                            eVal = this.getDayOfWeekNumber(sub);
                            if (eVal < 0) {
                                throw new Error("Invalid Day-of-Week value: '" + sub + "'" + String(i));
                            }
                            if (sVal > eVal) {
                                throw new Error('Invalid Day-of-Week sequence: ' + String(sVal) + ' > ' + String(eVal) + String(i));
                            }
                        }
                        else if (c === '#') {
                            try {
                                i += 4;
                                this.numDayOfWeek = Number(s.substring(i));
                                if (this.numDayOfWeek < 1 || this.numDayOfWeek > 5) {
                                    throw new Error();
                                }
                            }
                            catch (e) {
                                throw new Error("A numeric value between 1 and 5 must follow the '#' option" + String(i));
                            }
                        }
                        else if (c === 'L') {
                            this.lastDayOfWeek = true;
                            i = i + 1;
                        }
                    }
                }
                else {
                    throw new Error("Illegal characters for this position: '" + String(sub) + "'" + String(i));
                }
                if (eVal != -1) {
                    increment = 1;
                }
                this.addToSet(sVal, eVal, increment, type);
                return i + 3;
            }
            if (c === '?') {
                i++;
                if (i + 1 < s.length && s.charAt(i) != ' ' && s.charAt(i + 1) != '\t') {
                    throw new Error("Illegal character after '?': " + s.charAt(i) + String(i));
                }
                if (type != DAY_OF_WEEK && type != DAY_OF_MONTH) {
                    throw new Error("'?' can only be specified for Day-of-Month or Day-of-Week." + String(i));
                }
                if (type === DAY_OF_WEEK && !this.lastDayOfMonth) {
                    const val = this.daysOfMonth.last();
                    if (val === NO_SPEC_INT) {
                        throw new Error("'?' can only be specified for Day-of-Month -OR- Day-of-Week." + String(i));
                    }
                }
                this.addToSet(NO_SPEC_INT, -1, 0, type);
                return i;
            }
            if (c === '*' || c === '/') {
                if (c === '*' && i + 1 >= s.length) {
                    this.addToSet(ALL_SPEC_INT, -1, increment, type);
                    return i + 1;
                }
                else if (c === '/' && (i + 1 >= s.length || s.charAt(i + 1) === ' ' || s.charAt(i + 1) === '\t')) {
                    throw new Error("'/' must be followed by an integer." + String(i));
                }
                else if (c === '*') {
                    i++;
                }
                c = s.charAt(i);
                if (c === '/') {
                    i++;
                    if (i >= s.length) {
                        throw new Error('Unexpected end of string.' + String(i));
                    }
                    increment = this.getNumericValue(s, i);
                    i++;
                    if (increment > 10) {
                        i++;
                    }
                    if (increment > 59 && (type === SECOND || type === MINUTE)) {
                        throw new Error('Increment > 60 : ' + increment + i);
                    }
                    else if (increment > 23 && type === HOUR) {
                        throw new Error('Increment > 24 : ' + increment + i);
                    }
                    else if (increment > 31 && type === DAY_OF_MONTH) {
                        throw new Error('Increment > 31 : ' + increment + i);
                    }
                    else if (increment > 7 && type === DAY_OF_WEEK) {
                        throw new Error('Increment > 7 : ' + increment + i);
                    }
                    else if (increment > 12 && type === MONTH) {
                        throw new Error('Increment > 12 : ' + increment + i);
                    }
                }
                else {
                    increment = 1;
                }
                this.addToSet(ALL_SPEC_INT, -1, increment, type);
                return i;
            }
            else if (c === 'L') {
                i++;
                if (type === DAY_OF_MONTH) {
                    this.lastDayOfMonth = true;
                }
                if (type === DAY_OF_WEEK) {
                    this.addToSet(7, 7, 0, type);
                }
                if (type === DAY_OF_MONTH && s.length > i) {
                    c = s.charAt(i);
                    if (c === 'W') {
                        this.nearestWeekday = true;
                        i++;
                    }
                }
                return i;
            }
            else if (c >= '0' && c <= '9') {
                let val = Number(c.valueOf());
                i++;
                if (i >= s.length) {
                    this.addToSet(val, -1, -1, type);
                }
                else {
                    c = s.charAt(i);
                    if (c >= '0' && c <= '9') {
                        const vs = this.getValue(val, s, i);
                        val = vs[1];
                        i = vs[0];
                    }
                    i = this.checkNext(i, s, val, type);
                    return i;
                }
            }
            else {
                throw new Error('Unexpected character: ' + c + i);
            }
            return i;
        };
        this.skipWhiteSpace = function (i, s) {
            for (; i < s.length && (s.charAt(i) === ' ' || s.charAt(i) === '\t'); i++) {
            }
            return i;
        };
        this.getMonthNumber = function (s) {
            const integer = monthMap.get(s);
            if (integer === undefined) {
                return -1;
            }
            return integer;
        };
        this.getDayOfWeekNumber = function (s) {
            const integer = dayMap.get(s);
            if (integer === undefined) {
                return -1;
            }
            return integer;
        };
        this.addToSet = function (val, end, increment, type) {
            const set = this.getSet(type);
            if (type === SECOND || type === MINUTE) {
                if ((val < 0 || val > 59 || end > 59) && val != ALL_SPEC_INT) {
                    throw new Error('Minute and Second values must be between 0 and 59' + String(-1));
                }
            }
            else if (type === HOUR) {
                if ((val < 0 || val > 23 || end > 23) && val != ALL_SPEC_INT) {
                    throw new Error('Hour values must be between 0 and 23' + String(-1));
                }
            }
            else if (type === DAY_OF_MONTH) {
                if ((val < 1 || val > 31 || end > 31) && val != ALL_SPEC_INT && val != NO_SPEC_INT) {
                    throw new Error('Day of month values must be between 1 and 31' + String(-1));
                }
            }
            else if (type === MONTH) {
                if ((val < 1 || val > 12 || end > 12) && val != ALL_SPEC_INT) {
                    throw new Error('Month values must be between 1 and 12' + String(-1));
                }
            }
            else if (type === DAY_OF_WEEK) {
                if ((val === 0 || val > 7 || end > 7) && val != ALL_SPEC_INT && val != NO_SPEC_INT) {
                    throw new Error('Day-of-Week values must be between 1 and 7' + String(-1));
                }
            }
            if ((increment === 0 || increment === -1) && val != ALL_SPEC_INT) {
                if (val != -1) {
                    set.add(val);
                }
                else {
                    set.add(NO_SPEC_INT);
                }
                return;
            }
            let startAt = val;
            let stopAt = end;
            if (val === ALL_SPEC_INT && increment <= 0) {
                increment = 1;
                set.add(ALL_SPEC_INT);
            }
            if (type === SECOND || type === MINUTE) {
                if (stopAt === -1) {
                    stopAt = 59;
                }
                if (startAt === -1 || startAt === ALL_SPEC_INT) {
                    startAt = 0;
                }
            }
            else if (type === HOUR) {
                if (stopAt === -1) {
                    stopAt = 23;
                }
                if (startAt === -1 || startAt === ALL_SPEC_INT) {
                    startAt = 0;
                }
            }
            else if (type === DAY_OF_MONTH) {
                if (stopAt === -1) {
                    stopAt = 31;
                }
                if (startAt === -1 || startAt === ALL_SPEC_INT) {
                    startAt = 1;
                }
            }
            else if (type === MONTH) {
                if (stopAt === -1) {
                    stopAt = 12;
                }
                if (startAt === -1 || startAt === ALL_SPEC_INT) {
                    startAt = 1;
                }
            }
            else if (type === DAY_OF_WEEK) {
                if (stopAt === -1) {
                    stopAt = 7;
                }
                if (startAt === -1 || startAt === ALL_SPEC_INT) {
                    startAt = 1;
                }
            }
            else if (type === YEAR) {
                if (stopAt === -1) {
                    stopAt = 2099;
                }
                if (startAt === -1 || startAt === ALL_SPEC_INT) {
                    startAt = 1970;
                }
            }
            for (let i = startAt; i <= stopAt; i += increment) {
                set.add(i);
            }
        };
        this.getSet = function (type) {
            switch (type) {
                case SECOND:
                    return this.seconds;
                case MINUTE:
                    return this.minutes;
                case HOUR:
                    return this.hours;
                case DAY_OF_MONTH:
                    return this.daysOfMonth;
                case MONTH:
                    return this.months;
                case DAY_OF_WEEK:
                    return this.daysOfWeek;
                case YEAR:
                    return this.years;
            }
            return undefined;
        };
        this.getValue = function (v, s, i) {
            let c = s.charAt(i);
            let s1 = String(v);
            while (c >= '0' && c <= '9') {
                s1 = s1.concat(c);
                i++;
                if (i >= s.length) {
                    break;
                }
                c = s.charAt(i);
            }
            const val = [i < s.length ? i : i + 1, Number(s1)];
            return val;
        };
        this.getNumericValue = function (s, i) {
            const endOfVal = this.findNextWhiteSpace(i, s);
            const val = s.substring(i, endOfVal);
            return Number(val);
        };
        this.findNextWhiteSpace = function (i, s) {
            for (; i < s.length && (s.charAt(i) != ' ' || s.charAt(i) != '\t'); i++) {
            }
            return i;
        };
        this.checkNext = function (pos, s, val, type) {
            let end = -1;
            let i = pos;
            if (i >= s.length) {
                this.addToSet(val, end, -1, type);
                return i;
            }
            let c = s.charAt(pos);
            if (c === 'L') {
                if (type === DAY_OF_WEEK) {
                    this.lastDayOfWeek = true;
                }
                else {
                    throw new Error("'L' option is not valid here. (pos=" + i + ')' + i);
                }
                const set = this.getSet(type);
                set.add(val);
                i++;
                return i;
            }
            if (c === 'W') {
                if (type === DAY_OF_MONTH) {
                    this.nearestWeekday = true;
                }
                else {
                    throw new Error("'W' option is not valid here. (pos=" + i + ')' + i);
                }
                const set = this.getSet(type);
                set.add(val);
                i++;
                return i;
            }
            if (c === '#') {
                if (type != DAY_OF_WEEK) {
                    throw new Error("'#' option is not valid here. (pos=" + i + ')' + i);
                }
                i++;
                try {
                    this.numDayOfWeek = Number(s.substring(i));
                    if (this.numDayOfWeek < 1 || this.numDayOfWeek > 5) {
                        throw new Error();
                    }
                }
                catch (e) {
                    throw new Error("A numeric value between 1 and 5 must follow the '#' option" + i);
                }
                const set = this.getSet(type);
                set.add(val);
                i++;
                return i;
            }
            if (c === '-') {
                i++;
                c = s.charAt(i);
                const v = Number(c);
                end = v;
                i++;
                if (i >= s.length) {
                    this.addToSet(val, end, 1, type);
                    return i;
                }
                c = s.charAt(i);
                if (c >= '0' && c <= '9') {
                    const vs = this.getValue(v, s, i);
                    const v1 = vs[1];
                    end = v1;
                    i = vs[0];
                }
                if (i < s.length && (c = s.charAt(i)) === '/') {
                    i++;
                    c = s.charAt(i);
                    const v2 = Number(c);
                    i++;
                    if (i >= s.length) {
                        this.addToSet(val, end, v2, type);
                        return i;
                    }
                    c = s.charAt(i);
                    if (c >= '0' && c <= '9') {
                        const vs = this.getValue(v2, s, i);
                        const v3 = vs[1];
                        this.addToSet(val, end, v3, type);
                        i = vs[0];
                        return i;
                    }
                    else {
                        this.addToSet(val, end, v2, type);
                        return i;
                    }
                }
                else {
                    this.addToSet(val, end, 1, type);
                    return i;
                }
            }
            if (c === '/') {
                i++;
                c = s.charAt(i);
                const v2 = Number(c);
                i++;
                if (i >= s.length) {
                    this.addToSet(val, end, v2, type);
                    return i;
                }
                c = s.charAt(i);
                if (c >= '0' && c <= '9') {
                    const vs = this.getValue(v2, s, i);
                    const v3 = vs[1];
                    this.addToSet(val, end, v3, type);
                    i = vs[1];
                    return i;
                }
                else {
                    throw new Error("Unexpected character '" + c + "' after '/'" + i);
                }
            }
            this.addToSet(val, end, 0, type);
            i++;
            return i;
        };
        this.resetState = function () {
            this.expressionParsed = false;
            this.seconds = new jstreemap_1.TreeSet();
            this.minutes = new jstreemap_1.TreeSet();
            this.hours = new jstreemap_1.TreeSet();
            this.daysOfMonth = new jstreemap_1.TreeSet();
            this.months = new jstreemap_1.TreeSet();
            this.daysOfWeek = new jstreemap_1.TreeSet();
            this.years = new jstreemap_1.TreeSet();
            this.lastDayOfWeek = false;
            this.numDayOfWeek = 0;
            this.lastDayOfMonth = false;
            this.nearestWeekday = false;
            this.lastDayOffset = 0;
        };
        if (cronExpression === null) {
            throw new Error('cronExpression cannot be null');
        }
        this.cronExpression = cronExpression;
        this.buildExpressionSecondOptional(this.cronExpression.toUpperCase());
    }
}
exports.CronExpression = CronExpression;
//# sourceMappingURL=cronExpression.js.map