import type { Backend } from '../../backend';
import { Customresolver } from './construct';

export function defineCustomresolver(backend: Backend) {
  return new Customresolver(backend.createStack('customresolver'), 'customresolver', backend);
}
