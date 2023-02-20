/**
 * @see https://www.typescriptlang.org/docs/handbook/mixins.html
 */
export type Constructor<T = object> = new (...args: any[]) => T;
export type MixinResult<MixinInterface, TBase> = {
  new (...args: any[]): MixinInterface;
  prototype: MixinInterface;
} & TBase;
export { default as WithStorage, StorageMixin } from './storage';
export { default as WithContext, ContextMixin } from './context';
