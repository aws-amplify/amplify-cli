export const executeSdkPromisesWithExponentialBackoff = async <T>(
  sdkPromises: (() => Promise<T>)[],
): Promise<T[]> => {
  const MAX_RETRIES = 5;
  const MAX_BACKOFF_IN_MS = 10 * 1000; // 10 seconds
  let backoffSleepTimeInMs = 200;
  let consecutiveRetries = 0;

  let i = 0;
  let promiseResults = [];
  while (i < sdkPromises.length) {
    try {
      promiseResults.push(await sdkPromises[i]());
      ++i;
      // In case previously throttled, reset backoff
      backoffSleepTimeInMs = 200;
      consecutiveRetries = 0;
    } catch (e) {
      if (e?.code === 'Throttling') {
        if (consecutiveRetries < MAX_RETRIES) {
          ++consecutiveRetries;
          await new Promise(resolve => setTimeout(resolve, backoffSleepTimeInMs));
          backoffSleepTimeInMs = 2 ** consecutiveRetries * backoffSleepTimeInMs;
          backoffSleepTimeInMs = Math.min(Math.random() * backoffSleepTimeInMs, MAX_BACKOFF_IN_MS);
          continue;
        }
      }
      throw e;
    }
  }

  return promiseResults;
};
