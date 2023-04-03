import { JavaInteger } from './integer';
export declare class JavaArray extends Array<any> {
    private mapper;
    constructor(values: any[], mapper: Function);
    add(value: any): any;
    addAll(value: any): void;
    clear(): void;
    contains(value: any): boolean;
    containsAll(value?: any[]): boolean;
    isEmpty(): boolean;
    remove(value: any): void;
    removeAll(value: any): void;
    retainAll(): void;
    size(): JavaInteger;
    toJSON(): any[];
    indexOf(obj: any): number;
}
//# sourceMappingURL=array.d.ts.map