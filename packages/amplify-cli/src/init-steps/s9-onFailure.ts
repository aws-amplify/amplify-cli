import * as util from 'util';
import { print } from '../extensions/amplify-helpers/print';

export function onFailure(e) {
  print.error('init failed');
  print.info(util.inspect(e));
  // Exit the process with a failure code
  process.exit(1);
}
