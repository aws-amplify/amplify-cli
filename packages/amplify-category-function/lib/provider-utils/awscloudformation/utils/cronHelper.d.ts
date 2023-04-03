import { CronBuilder } from '../utils/cronBuilder';
export type dtType = any;
export declare function minuteHelper(context: any): Promise<string>;
export declare function hourHelper(context: any): Promise<string>;
export declare function timeHelper(exp: CronBuilder): Promise<CronBuilder>;
export declare function weekHelper(exp: CronBuilder): Promise<CronBuilder>;
export declare function monthHelper(exp: any, context: any): Promise<any>;
export declare function yearHelper(exp: any, context: any): Promise<any>;
//# sourceMappingURL=cronHelper.d.ts.map