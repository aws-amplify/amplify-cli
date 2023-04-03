/**
 * invokes cli for diagnose with --send-report flag
 * @param cwd current working directory
 * @returns void
 */
export declare const diagnoseSendReport: (cwd: string) => Promise<string>;
/**
 * Send failing zipping
 * @param cwd current working directory
 */
export declare const diagnoseSendReport_ZipFailed: (cwd: string) => Promise<void>;
