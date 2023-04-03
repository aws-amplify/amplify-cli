import { TreeSet } from 'jstreemap';
export declare class CronExpression {
    private cronExpression;
    seconds: TreeSet<unknown>;
    minutes: TreeSet<unknown>;
    hours: TreeSet<unknown>;
    daysOfMonth: TreeSet<unknown>;
    months: TreeSet<unknown>;
    daysOfWeek: TreeSet<unknown>;
    years: TreeSet<unknown>;
    lastDayOfWeek: boolean;
    numDayOfWeek: number;
    lastDayOfMonth: boolean;
    nearestWeekday: boolean;
    expressionParsed: boolean;
    strMinutes: string;
    strHours: string;
    strWeekdays: string;
    strMonths: string;
    strDaysOfMonth: string;
    constructor(cronExpression: string);
    private buildExpressionSecondOptional;
    buildExpression: (cronExpression: string) => void;
    storeExpressionValues: (pos: number, s: string, type: number) => number;
    skipWhiteSpace: (i: number, s: string) => number;
    getMonthNumber: (s: string) => number;
    getDayOfWeekNumber: (s: string) => number;
    addToSet: (val: number, end: number, increment: number, type: number) => void;
    getSet: (type: number) => any;
    getValue: (v: number, s: string, i: number) => [number, number];
    getNumericValue: (s: string, i: number) => number;
    findNextWhiteSpace: (i: number, s: string) => number;
    checkNext: (pos: number, s: string, val: number, type: number) => number;
    resetState: () => void;
}
//# sourceMappingURL=cronExpression.d.ts.map