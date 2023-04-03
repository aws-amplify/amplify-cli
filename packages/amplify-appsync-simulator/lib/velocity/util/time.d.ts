import 'moment-timezone';
import 'moment-jdateformatparser';
declare module 'moment' {
    interface Moment {
        toMomentFormatString: (format: string) => string;
        formatWithJDF: (format: string) => string;
    }
}
export declare const time: () => {
    nowISO8601(): string;
    nowEpochSeconds(): number;
    nowEpochMilliSeconds(): number;
    nowFormatted(format: string, timezone?: string): string | null;
    parseFormattedToEpochMilliSeconds(dateTime: string, format: string, timezone?: string): number | null;
    parseISO8601ToEpochMilliSeconds(dateTime: any): number | null;
    epochMilliSecondsToSeconds(milliseconds: number): number | null;
    epochMilliSecondsToISO8601(dateTime: number): string | null;
    epochMilliSecondsToFormatted(timestamp: number, format: string, timezone?: string): string | null;
};
//# sourceMappingURL=time.d.ts.map