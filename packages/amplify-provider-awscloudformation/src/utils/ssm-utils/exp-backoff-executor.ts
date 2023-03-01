export const executeSdkPromisesWithExponentialBackOff = async <T>(sdkPromises: (() => Promise<T>)[]): Promise<T[]> => {
  const MAX_RETRIES = 5;
  const MAX_BACK_OFF_IN_MS = 10 * 1000; // 10 seconds
  let backOffSleepTimeInMs = 200;
  let consecutiveRetries = 0;

  let i = 0;
  const promiseResults = [];
  while (i < sdkPromises.length) {
    try {
      promiseResults.push(await sdkPromises[i]());
      ++i;
      // In case previously throttled, reset backoff
      backOffSleepTimeInMs = 200;
      consecutiveRetries = 0;
    } catch (e) {
      if (e?.code === 'ThrottlingException' || e?.code === 'Throttling') {
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
