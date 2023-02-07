/**
 * @see https://www.typescriptlang.org/docs/handbook/mixins.html
 */
export type Constructor<T = object> = new (...args: any[]) => T;
export { StorageMixin } from './storage';
export { ContextMixin } from './context';
