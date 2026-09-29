import * as util from 'util';
import { print } from '../extensions/amplify-helpers/print';

export function onFailure(e) {
  // If no stack present it means we already printed a friendly error message and cleared the stack.
  if (e.stack) {
    print.info(util.inspect(e));
  }

  // Exit the process with a failure code
  process.exit(1);
}
