export const executeSdkPromisesWithExponentialBackOff = async <T>(sdkPromises: (() => Promise<T>)[]): Promise<T[]> => {
  const MAX_RETRIES = 5;
  const MAX_BACK_OFF_IN_MS = 10 * 1000; // 10 seconds
  const MIN_BACK_OFF_IN_MS = 1000; // 1 second
  let backOffSleepTimeInMs = 500;
  let consecutiveRetries = 0;

  let i = 0;
  const promiseResults = [];
  while (i < sdkPromises.length) {
    try {
      promiseResults.push(await sdkPromises[i]());
      ++i;
      // In case previously throttled, reset backoff
      backOffSleepTimeInMs = 500;
      consecutiveRetries = 0;
    } catch (e) {
      if (e?.name === 'ThrottlingException' || e?.name === 'Throttling') {
        if (consecutiveRetries < MAX_RETRIES) {
          ++consecutiveRetries;
          await new Promise((resolve) => setTimeout(resolve, backOffSleepTimeInMs));
          backOffSleepTimeInMs = 2 ** consecutiveRetries * backOffSleepTimeInMs;
          backOffSleepTimeInMs = Math.max(Math.min(Math.random() * backOffSleepTimeInMs, MAX_BACK_OFF_IN_MS), MIN_BACK_OFF_IN_MS);
          continue;
        }
      }
      throw e;
    }
  }

  return promiseResults;
};
