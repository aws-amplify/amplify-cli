import { JavaArray } from './array';
import { JavaInteger } from './integer';
export declare class JavaString {
    value: string;
    constructor(str: any);
    concat(str: any): JavaString;
    contains(str: any): boolean;
    endsWith(suffix: any): boolean;
    equals(str: any): boolean;
    indexOf(val: any, fromIndex?: number): JavaInteger;
    isEmpty(): boolean;
    lastIndexOf(val: any, fromIndex?: number): JavaInteger;
    replace(find: any, replace: any): JavaString;
    replaceAll(find: any, replace: any): JavaString;
    replaceFirst(find: any, replace: any): JavaString;
    matches(regexString: any): boolean;
    split(regexString: any, limit?: any): JavaArray;
    startsWith(prefix: any, offset?: number): boolean;
    substring(beginIndex: any, endIndex?: number): string;
    toJSON(): string;
    toLowerCase(): JavaString;
    toUpperCase(): JavaString;
    toString(): string;
    toIdString(): string;
    trim(): JavaString;
    length(): JavaInteger;
    toJson(): string;
}
//# sourceMappingURL=string.d.ts.map