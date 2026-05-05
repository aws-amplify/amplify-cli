import type { Backend } from '../../backend';
import { Customfinance } from './construct';

export function defineCustomfinance(backend: Backend) {
  new Customfinance(backend.createStack('customfinance'), 'customfinance');
}
