import _ from 'lodash';
import { sleep } from './sleep';

const defaultSettings: RetrySettings = {
  times: Infinity,
  delayMS: 1000 * 10, // 10 seconds
  timeoutMS: 1000 * 60 * 20, // 20 minutes
  stopOnError: true, // terminate the retries if a func calls throws an exception
};

/**
 * Retries the function func until the predicate pred returns true, or until one of the retry limits is met.
 * @param func The function to retry
 * @param successPredicate The predicate that determines successful output of func
 * @param settings Retry limits (defaults to defaultSettings above)
 * @param failurePredicate An optional predicate that determines that the retry operation has failed and should not be retried anymore
 */
export const retry = async <T>(
  func: () => Promise<T>,
  successPredicate: (res?: T) => boolean,
  settings?: Partial<RetrySettings>,
  failurePredicate?: (res?: T) => boolean,
): Promise<T> => {
  const { times, delayMS, timeoutMS, stopOnError } = _.merge({}, defaultSettings, settings);

  let count = 0;
  let result: T;
  let terminate = false;
  const startTime = Date.now();

  do {
    try {
      result = await func();
      if (successPredicate(result)) {
        return result;
      }
      if (typeof failurePredicate === 'function' && failurePredicate(result)) {
        throw new Error('Retry-able function execution result matched failure predicate. Stopping retries.');
      }
      console.warn(`Retry-able function execution did not match success predicate. Result was [${JSON.stringify(result)}]. Retrying...`);
    } catch (err) {
      console.warn(`Retry-able function execution failed with [${err.message || err}]`);
      if (stopOnError) {
        console.log('Stopping retries on error.');
      } else {
        console.log('Retrying...');
      }
      terminate = stopOnError;
    }
    count++;
    await sleep(delayMS);
  } while (!terminate && count <= times && Date.now() - startTime < timeoutMS);

  throw new Error('Retry-able function did not match predicate within the given retry constraints');
};

/**
 * Configuration for retry limits
 */
export type RetrySettings = {
  times: number; // specifying 1 will execute func once and if not successful, retry one time
  delayMS: number; // delay between each attempt to execute func (there is no initial delay)
  timeoutMS: number; // total amount of time to retry execution
  stopOnError: boolean; // if retries should stop if func throws an error
};
