import { migrate } from './index';

/**
 *
 */
export class TestClass {
  constructor(private readonly prop: string) { }

  /**
   *
   */
  method(): string {
    return this.prop;
  }

  another = (): string => {
    migrate({});
    return 'hello';
  }
}

/**
 *
 */
export function myFunc(param: string): string {
  console.log(param);
  return param;
}

export const myVar = 'string';
