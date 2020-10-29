import { print } from '../extensions/amplify-helpers/print';
import * as util from 'util';

export function onFailure(e) {
  print.error('Error occurred during configuration.');
  print.info(util.inspect(e));
}
