import { JavaArray } from './array';
import { JavaInteger } from './integer';
export declare class JavaMap {
    private map;
    private mapper;
    constructor(obj: any, mapper: any);
    clear(): void;
    containsKey(key: any): boolean;
    containsValue(value: any): boolean;
    entrySet(): JavaArray;
    equals(value: any): boolean;
    get(key: any): any;
    isEmpty(): boolean;
    keySet(): JavaArray;
    put(key: any, value: any): any;
    putAll(map: object | JavaMap): void;
    remove(key: any): any;
    size(): JavaInteger;
    values(): JavaArray;
    toJSON(): {};
}
export declare function createMapProxy(map: any): any;
//# sourceMappingURL=map.d.ts.map