export class SpyProxyHandler<T extends object, U extends keyof T & (string | symbol)> implements ProxyHandler<T> {
  get(target: T, name: U) {
    if (name in target) {
      if (typeof target[name] === 'function') {
        return jest.spyOn(target, (name as unknown) as any);
      } else {
        return target[name];
      }
    }
    return undefined;
  }
}
