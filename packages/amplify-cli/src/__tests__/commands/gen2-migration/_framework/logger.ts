import { SpinningLogger } from '../../../../commands/gen2-migration/_spinning-logger';

/** Creates a no-op SpinningLogger suitable for unit tests. */
export function noOpLogger(): SpinningLogger {
  return new SpinningLogger('test', { debug: true });
}
