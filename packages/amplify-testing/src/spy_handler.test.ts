import { SpyProxyHandler } from './spy_handler';

describe('Jest Spy Proxy Handler', () => {
  describe('when getting a property on the target', () => {
    describe('that is undefined', () => {
      test('undefined is returned', () => {
        const target = ({} as unknown) as any;
        const proxy = new Proxy(target, new SpyProxyHandler());
        expect(proxy.foo).toBeUndefined();
      });
    });
    describe('whose type is not a function', () => {
      test('the value is returned', () => {
        const target = {
          foo: 'bar',
        };
        const proxy = new Proxy(target, new SpyProxyHandler());
        expect(proxy.foo).toBe('bar');
      });
    });
    describe('whose type is a function', () => {
      test('a spy is set on the target', () => {
        const target = {
          foo: () => 'bar',
        };
        const proxy = new Proxy(target, new SpyProxyHandler());
        expect(jest.isMockFunction(proxy.foo)).toBe(true);
        expect(proxy.foo()).toBe('bar');
        expect(proxy.foo).toHaveBeenCalled();
      });
    });
  });
});
