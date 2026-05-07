import type { Backend } from '../../backend';
import { Customfinance } from './construct';

export function defineCustomfinance(backend: Backend) {
  return new Customfinance(backend.createStack('customfinance'), 'customfinance');
}
