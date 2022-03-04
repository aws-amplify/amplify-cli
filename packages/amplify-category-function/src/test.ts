import { migrate } from './index';

/**
 * description
 */
export class TestClass {
  constructor(private readonly prop: string) { }

  /**
   * a description
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
 * description
 */
export function myFunc(param: string): string {
  console.log(param);
  return param;
}

export const MY_VAR = 'string';
