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
 * @param pred The predicate that determines successful output of func
 * @param settings Retry limits (defaults to defaultSettings above)
 */
export const retry = async <T>(func: () => Promise<T>, pred: (res?: T) => boolean, settings?: Partial<RetrySettings>) => {
  const { times, delayMS, timeoutMS, stopOnError } = _.merge({}, defaultSettings, settings);

  let count = 0;
  let result: T = undefined;
  let terminate = false;
  const startTime = Date.now();

  do {
    try {
      result = await func();
      if (pred(result)) {
        return result;
      } else {
        console.warn(`Retryable function execution did not match predicate. Result was [${JSON.stringify(result)}]. Retrying...`);
      }
    } catch (err) {
      console.warn(`Retryable function execution failed with [${err}]. Retrying...`);
      terminate = stopOnError;
    }
    count++;
    await sleep(delayMS);
  } while (!terminate && count <= times && Date.now() - startTime < timeoutMS);

  throw new Error('Retryable function did not match predicate within the given retry constraints');
};

export type RetrySettings = {
  times: number; // specifying 1 will execute func once and if not successful, retry one time
  delayMS: number; // delay between each attempt to execute func (there is no initial delay)
  timeoutMS: number; // total amount of time to retry execution
  stopOnError: boolean; // if retries should stop if func throws an error
};
