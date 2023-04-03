"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeSdkPromisesWithExponentialBackOff = void 0;
const executeSdkPromisesWithExponentialBackOff = async (sdkPromises) => {
    const MAX_RETRIES = 5;
    const MAX_BACK_OFF_IN_MS = 10 * 1000;
    let backOffSleepTimeInMs = 200;
    let consecutiveRetries = 0;
    let i = 0;
    const promiseResults = [];
    while (i < sdkPromises.length) {
        try {
            promiseResults.push(await sdkPromises[i]());
            ++i;
            backOffSleepTimeInMs = 200;
            consecutiveRetries = 0;
        }
        catch (e) {
            if ((e === null || e === void 0 ? void 0 : e.code) === 'ThrottlingException' || (e === null || e === void 0 ? void 0 : e.code) === 'Throttling') {
                if (consecutiveRetries < MAX_RETRIES) {
                    ++consecutiveRetries;
                    await new Promise((resolve) => setTimeout(resolve, backOffSleepTimeInMs));
                    backOffSleepTimeInMs = 2 ** consecutiveRetries * backOffSleepTimeInMs;
                    backOffSleepTimeInMs = Math.min(Math.random() * backOffSleepTimeInMs, MAX_BACK_OFF_IN_MS);
                    continue;
                }
            }
            throw e;
        }
    }
    return promiseResults;
};
exports.executeSdkPromisesWithExponentialBackOff = executeSdkPromisesWithExponentialBackOff;
//# sourceMappingURL=exp-backoff-executor.js.map