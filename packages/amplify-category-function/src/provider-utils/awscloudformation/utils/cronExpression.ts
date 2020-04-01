/*
AWS Cron Expression generator
*/

import { TreeSet } from 'jstreemap';
const SECOND = 0;
const MINUTE = 1;
const HOUR = 2;
const DAY_OF_MONTH = 3;
const MONTH = 4;
const DAY_OF_WEEK = 5;
const YEAR = 6;
const ALL_SPEC_INT = 99; // '*'
const NO_SPEC_INT = 98; // '?'
let monthMap = new Map();
let dayMap = new Map();

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

export class CronExpression {
  private cronExpression: string = null;
  seconds = new TreeSet();
  minutes = new TreeSet();
  hours = new TreeSet();
  daysOfMonth = new TreeSet();
  months = new TreeSet();
  daysOfWeek = new TreeSet();
  years = new TreeSet();
  lastdayOfWeek: boolean = false;
  nthdayOfWeek: Number = 0;
  lastdayOfMonth: boolean = false;
  nearestWeekday: boolean = false;
  expressionParsed: boolean = false;

  strMinutes: string = null;
  strHours: string = null;
  strWeekdays: string = null;
  strMonths: string = null;
  strDaysOfMonth: string = null;

  constructor(cronExpression: string) {
    if (cronExpression === null) {
      throw new Error('cronExpression cannot be null');
    }
    this.cronExpression = cronExpression;
    this.buildExpressionSecondOptional(this.cronExpression.toUpperCase());
  }

  private buildExpressionSecondOptional = function(cronExpression: string): void {
    let parsesWithMissingSeconds: boolean = false;
    try {
      //assume the expression doesn't contain seconds
      this.buildExpression('0 ' + cronExpression);
      parsesWithMissingSeconds = true;
    } catch (e) {}
    let parsesWithOriginal: boolean = false;
    this.resetState();
    try {
      // check if the expression can be parsed as is
      this.buildExpression(cronExpression);
      parsesWithOriginal = true;
    } catch (e) {
      if (!parsesWithMissingSeconds) {
        // the expression is definitely invalid
        throw new Error(e);
      } else {
        this.resetState();
        this.buildExpression('0 ' + cronExpression);
      }
    }

    if (parsesWithMissingSeconds && parsesWithOriginal) {
      throw new Error('Ambiguous cron expression' + String(-1));
    }
  };

  buildExpression = function(cronExpression: string): void {
    this.expressionParsed = true;
    try {
      if (this.seconds === null) {
        this.seconds = new TreeSet();
      }
      if (this.minutes === null) {
        this.minutes = new TreeSet();
      }
      if (this.hours === null) {
        this.hours = new TreeSet();
      }
      if (this.daysOfMonth === null) {
        this.daysOfMonth = new TreeSet();
      }
      if (this.months === null) {
        this.months = new TreeSet();
      }
      if (this.daysOfWeek === null) {
        this.daysOfWeek = new TreeSet();
      }
      if (this.years === null) {
        this.years = new TreeSet();
      }

      let exprOn = SECOND;

      let exprsTok: string[] = cronExpression.split(' ');
      let len_exprsTok = 0;
      while (len_exprsTok <= exprsTok.length - 1 && exprOn <= YEAR) {
        if (exprsTok[len_exprsTok] != undefined) {
          let expr: string = exprsTok[len_exprsTok].trim();
          let vTok: string[] = expr.split(',');
          let len_vTok = 0;
          while (len_vTok <= vTok.length - 1) {
            if (vTok[len_vTok] != undefined) {
              let v: string = vTok[len_vTok];
              this.storeExpressionVals(0, v, exprOn);
            }
            len_vTok++;
          }
          exprOn++;
        }
        len_exprsTok++;
      }

      if (exprOn <= DAY_OF_WEEK) {
        throw new Error('Unexpected end of expression.');
      }

      if (exprOn <= YEAR) {
        this.storeExpressionVals(0, '*', YEAR);
      }
      let dow: TreeSet<number> = this.getSet(DAY_OF_WEEK);

      let dom: TreeSet<number> = this.getSet(DAY_OF_MONTH);

      // Copying the logic from the UnsupportedOperationException below
      let dayOfMSpec: boolean = !dom.has(NO_SPEC_INT);
      let dayOfWSpec: boolean = !dow.has(NO_SPEC_INT);

      if (dayOfMSpec && !dayOfWSpec) {
        // skip
      } else if (dayOfWSpec && !dayOfMSpec) {
        // skip
      } else {
        throw new Error('Specifying both a day-of-week AND a day-of-month parameter is not supported.');
      }
    } catch (e) {
      throw new Error(e);
    }
  };

  storeExpressionVals = function(pos: number, s: string, type: number): number {
    let incr: number = 0;
    let i: number = this.skipWhiteSpace(pos, s);
    if (i >= s.length) {
      return i;
    }
    let c: String = s.charAt(i);
    if (c >= 'A' && c <= 'Z' && !(s === 'L') && !(s === 'LW')) {
      let sub: string = s.substring(i, i + 3);
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
      } else if (type === DAY_OF_WEEK) {
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
          } else if (c === '#') {
            try {
              i += 4;
              this.nthdayOfWeek = Number(s.substring(i));
              if (this.nthdayOfWeek < 1 || this.nthdayOfWeek > 5) {
                throw new Error();
              }
            } catch (e) {
              throw new Error("A numeric value between 1 and 5 must follow the '#' option" + String(i));
            }
          } else if (c === 'L') {
            this.lastdayOfWeek = true;
            i = i + 1;
          }
        }
      } else {
        throw new Error("Illegal characters for this position: '" + String(sub) + "'" + String(i));
      }
      if (eVal != -1) {
        incr = 1;
      }
      this.addToSet(sVal, eVal, incr, type);
      return i + 3;
    }

    if (c === '?') {
      i++;
      if (i + 1 < s.length && s.charAt(i) != ' ' && s.charAt(i + 1) != '\t') {
        throw new Error("Illegal character after '?': " + s.charAt(i) + String(i));
      }
      if (type != DAY_OF_WEEK && type != DAY_OF_MONTH) {
        throw new Error("'?' can only be specfied for Day-of-Month or Day-of-Week." + String(i));
      }
      if (type === DAY_OF_WEEK && !this.lastdayOfMonth) {
        let val: number = this.daysOfMonth.last();
        if (val === NO_SPEC_INT) {
          throw new Error("'?' can only be specfied for Day-of-Month -OR- Day-of-Week." + String(i));
        }
      }

      this.addToSet(NO_SPEC_INT, -1, 0, type);
      return i;
    }

    if (c === '*' || c === '/') {
      if (c === '*' && i + 1 >= s.length) {
        this.addToSet(ALL_SPEC_INT, -1, incr, type);
        return i + 1;
      } else if (c === '/' && (i + 1 >= s.length || s.charAt(i + 1) === ' ' || s.charAt(i + 1) === '\t')) {
        throw new Error("'/' must be followed by an integer." + String(i));
      } else if (c === '*') {
        i++;
      }
      c = s.charAt(i);
      if (c === '/') {
        // is an increment specified?
        i++;
        if (i >= s.length) {
          throw new Error('Unexpected end of string.' + String(i));
        }

        incr = this.getNumericValue(s, i);

        i++;
        if (incr > 10) {
          i++;
        }
        if (incr > 59 && (type === SECOND || type === MINUTE)) {
          throw new Error('Increment > 60 : ' + incr + i);
        } else if (incr > 23 && type === HOUR) {
          throw new Error('Increment > 24 : ' + incr + i);
        } else if (incr > 31 && type === DAY_OF_MONTH) {
          throw new Error('Increment > 31 : ' + incr + i);
        } else if (incr > 7 && type === DAY_OF_WEEK) {
          throw new Error('Increment > 7 : ' + incr + i);
        } else if (incr > 12 && type === MONTH) {
          throw new Error('Increment > 12 : ' + incr + i);
        }
      } else {
        incr = 1;
      }

      this.addToSet(ALL_SPEC_INT, -1, incr, type);
      return i;
    } else if (c === 'L') {
      i++;
      if (type === DAY_OF_MONTH) {
        this.lastdayOfMonth = true;
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
    } else if (c >= '0' && c <= '9') {
      let val: number = Number(c.valueOf());
      i++;
      if (i >= s.length) {
        this.addToSet(val, -1, -1, type);
      } else {
        c = s.charAt(i);
        if (c >= '0' && c <= '9') {
          let vs: [number, number] = this.getValue(val, s, i);
          val = vs[1];
          i = vs[0];
        }
        i = this.checkNext(i, s, val, type);
        return i;
      }
    } else {
      throw new Error('Unexpected character: ' + c + i);
    }

    return i;
  };

  skipWhiteSpace = function(i: number, s: String): number {
    for (; i < s.length && (s.charAt(i) === ' ' || s.charAt(i) === '\t'); i++) {}

    return i;
  };

  getMonthNumber = function(s: String): number {
    let integer: number = monthMap.get(s);

    if (integer === undefined) {
      return -1;
    }

    return integer;
  };

  getDayOfWeekNumber = function(s: String): number {
    let integer: number = dayMap.get(s);

    if (integer === undefined) {
      return -1;
    }

    return integer;
  };
  addToSet = function(val: number, end: number, incr: number, type: number) {
    let set = this.getSet(type);

    if (type === SECOND || type === MINUTE) {
      if ((val < 0 || val > 59 || end > 59) && val != ALL_SPEC_INT) {
        throw new Error('Minute and Second values must be between 0 and 59' + String(-1));
      }
    } else if (type === HOUR) {
      if ((val < 0 || val > 23 || end > 23) && val != ALL_SPEC_INT) {
        throw new Error('Hour values must be between 0 and 23' + String(-1));
      }
    } else if (type === DAY_OF_MONTH) {
      if ((val < 1 || val > 31 || end > 31) && val != ALL_SPEC_INT && val != NO_SPEC_INT) {
        throw new Error('Day of month values must be between 1 and 31' + String(-1));
      }
    } else if (type === MONTH) {
      if ((val < 1 || val > 12 || end > 12) && val != ALL_SPEC_INT) {
        throw new Error('Month values must be between 1 and 12' + String(-1));
      }
    } else if (type === DAY_OF_WEEK) {
      if ((val === 0 || val > 7 || end > 7) && val != ALL_SPEC_INT && val != NO_SPEC_INT) {
        throw new Error('Day-of-Week values must be between 1 and 7' + String(-1));
      }
    }

    if ((incr === 0 || incr === -1) && val != ALL_SPEC_INT) {
      if (val != -1) {
        set.add(val);
      } else {
        set.add(NO_SPEC_INT);
      }

      return;
    }
    let startAt: number = val;
    let stopAt: number = end;

    if (val === ALL_SPEC_INT && incr <= 0) {
      incr = 1;
      set.add(ALL_SPEC_INT); // put in a marker, but also fill values
    }

    if (type === SECOND || type === MINUTE) {
      if (stopAt === -1) {
        stopAt = 59;
      }
      if (startAt === -1 || startAt === ALL_SPEC_INT) {
        startAt = 0;
      }
    } else if (type === HOUR) {
      if (stopAt === -1) {
        stopAt = 23;
      }
      if (startAt === -1 || startAt === ALL_SPEC_INT) {
        startAt = 0;
      }
    } else if (type === DAY_OF_MONTH) {
      if (stopAt === -1) {
        stopAt = 31;
      }
      if (startAt === -1 || startAt === ALL_SPEC_INT) {
        startAt = 1;
      }
    } else if (type === MONTH) {
      if (stopAt === -1) {
        stopAt = 12;
      }
      if (startAt === -1 || startAt === ALL_SPEC_INT) {
        startAt = 1;
      }
    } else if (type === DAY_OF_WEEK) {
      if (stopAt === -1) {
        stopAt = 7;
      }
      if (startAt === -1 || startAt === ALL_SPEC_INT) {
        startAt = 1;
      }
    } else if (type === YEAR) {
      if (stopAt === -1) {
        stopAt = 2099;
      }
      if (startAt === -1 || startAt === ALL_SPEC_INT) {
        startAt = 1970;
      }
    }

    for (let i = startAt; i <= stopAt; i += incr) {
      set.add(i);
    }
  };

  getSet = function(type: number) {
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
  };

  // get the string value
  getValue = function(v: number, s: string, i: number) {
    let c: string = s.charAt(i);
    let s1: string = String(v);
    while (c >= '0' && c <= '9') {
      s1 = s1.concat(c);
      i++;
      if (i >= s.length) {
        break;
      }
      c = s.charAt(i);
    }
    let val: [number, number];

    val = [i < s.length ? i : i + 1, Number(s1)];
    return val;
  };

  getNumericValue = function(s: string, i: number): number {
    let endOfVal = this.findNextWhiteSpace(i, s);
    let val: string = s.substring(i, endOfVal);
    return Number(val);
  };

  findNextWhiteSpace = function(i: number, s: String) {
    for (; i < s.length && (s.charAt(i) != ' ' || s.charAt(i) != '\t'); i++) {}
    return i;
  };
  checkNext = function(pos: number, s: string, val: number, type: number): number {
    let end = -1;
    let i = pos;

    if (i >= s.length) {
      this.addToSet(val, end, -1, type);
      return i;
    }

    let c: string = s.charAt(pos);

    if (c === 'L') {
      if (type === DAY_OF_WEEK) {
        this.lastdayOfWeek = true;
      } else {
        throw new Error("'L' option is not valid here. (pos=" + i + ')' + i);
      }
      let set = this.getSet(type);
      set.add(val);
      i++;
      return i;
    }

    if (c === 'W') {
      if (type === DAY_OF_MONTH) {
        this.nearestWeekday = true;
      } else {
        throw new Error("'W' option is not valid here. (pos=" + i + ')' + i);
      }
      let set = this.getSet(type);
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
        this.nthdayOfWeek = Number(s.substring(i));
        if (this.nthdayOfWeek < 1 || this.nthdayOfWeek > 5) {
          throw new Error();
        }
      } catch (e) {
        throw new Error("A numeric value between 1 and 5 must follow the '#' option" + i);
      }

      let set = this.getSet(type);
      set.add(val);
      i++;
      return i;
    }

    if (c === '-') {
      i++;
      c = s.charAt(i);
      let v: number = Number(c);
      end = v;
      i++;
      if (i >= s.length) {
        this.addToSet(val, end, 1, type);
        return i;
      }
      c = s.charAt(i);
      if (c >= '0' && c <= '9') {
        let vs: [number, number] = this.getValue(v, s, i);
        let v1 = vs[1];
        end = v1;
        i = vs[0];
      }
      if (i < s.length && (c = s.charAt(i)) === '/') {
        i++;
        c = s.charAt(i);
        let v2: number = Number(c);
        i++;
        if (i >= s.length) {
          this.addToSet(val, end, v2, type);
          return i;
        }
        c = s.charAt(i);
        if (c >= '0' && c <= '9') {
          let vs: [number, number] = this.getValue(v2, s, i);
          let v3 = vs[1];
          this.addToSet(val, end, v3, type);
          i = vs[0];
          return i;
        } else {
          this.addToSet(val, end, v2, type);
          return i;
        }
      } else {
        this.addToSet(val, end, 1, type);
        return i;
      }
    }

    if (c === '/') {
      i++;
      c = s.charAt(i);
      let v2 = Number(c);
      i++;
      if (i >= s.length) {
        this.addToSet(val, end, v2, type);
        return i;
      }
      c = s.charAt(i);
      if (c >= '0' && c <= '9') {
        let vs: [number, number] = this.getValue(v2, s, i);
        let v3 = vs[1];
        this.addToSet(val, end, v3, type);
        i = vs[1];
        return i;
      } else {
        throw new Error("Unexpected character '" + c + "' after '/'" + i);
      }
    }

    this.addToSet(val, end, 0, type);
    i++;
    return i;
  };

  resetState = function() {
    // reset internal state
    this.expressionParsed = false;

    this.seconds = new TreeSet();
    this.minutes = new TreeSet();
    this.hours = new TreeSet();
    this.daysOfMonth = new TreeSet();
    this.months = new TreeSet();
    this.daysOfWeek = new TreeSet();
    this.years = new TreeSet();

    this.lastdayOfWeek = false;
    this.nthdayOfWeek = 0;
    this.lastdayOfMonth = false;
    this.nearestWeekday = false;
    this.lastdayOffset = 0;
  };
}
