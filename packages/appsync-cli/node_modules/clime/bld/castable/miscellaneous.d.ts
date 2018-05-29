export declare class CommaSeparatedStrings extends Array<string> {
    private constructor();
    static cast(line: string): CommaSeparatedStrings;
}
declare class CastableDate extends Date {
    private constructor();
    toDate(): Date;
    static cast(str: string): CastableDate;
}
export { CastableDate as Date, CastableDate };
