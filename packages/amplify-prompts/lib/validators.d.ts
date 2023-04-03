export type Validator = (value: string) => true | string | Promise<true | string>;
export declare const alphanumeric: (message?: string) => Validator;
export declare const matchRegex: (validatorRegex: RegExp, message?: string) => Validator;
export declare const integer: (message?: string) => Validator;
export declare const maxLength: (maxLen: number, message?: string) => Validator;
export declare const minLength: (minLen: number, message?: string) => Validator;
export declare const exact: (expected: string, message?: string) => Validator;
export declare const between: (min: number, max: number, message?: string) => Validator;
export declare const and: (validators: [Validator, Validator, ...Validator[]], message?: string) => Validator;
export declare const or: (validators: [Validator, Validator, ...Validator[]], message?: string) => Validator;
export declare const not: (validator: Validator, message: string) => Validator;
//# sourceMappingURL=validators.d.ts.map