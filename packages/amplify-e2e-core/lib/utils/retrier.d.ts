/**
 * Retries the function func until the predicate pred returns true, or until one of the retry limits is met.
 * @param func The function to retry
 * @param successPredicate The predicate that determines successful output of func
 * @param settings Retry limits (defaults to defaultSettings above)
 * @param failurePredicate An optional predicate that determines that the retry operation has failed and should not be retried anymore
 */
export declare const retry: <T>(func: () => Promise<T>, successPredicate: (res?: T) => boolean, settings?: Partial<RetrySettings>, failurePredicate?: (res?: T) => boolean) => Promise<T>;
/**
 * Configuration for retry limits
 */
export type RetrySettings = {
    times: number;
    delayMS: number;
    timeoutMS: number;
    stopOnError: boolean;
};
