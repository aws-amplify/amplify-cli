/// <reference types="node" />
import { CastingContext } from '../core';
export declare class File {
    readonly source: string;
    readonly cwd: string;
    readonly baseName: string;
    readonly fullName: string;
    readonly default: boolean;
    private constructor();
    require<T>(): T;
    buffer(): Promise<Buffer>;
    text(encoding?: string): Promise<string>;
    json<T>(encoding?: string): Promise<T>;
    assert(exists?: boolean): Promise<void>;
    exists(): Promise<boolean>;
    exists(extensions: string[]): Promise<string | undefined>;
    static cast(name: string, context: CastingContext<File>): File;
}
export declare class Directory {
    readonly source: string;
    readonly cwd: string;
    readonly baseName: string;
    readonly fullName: string;
    readonly default: boolean;
    private constructor();
    assert(exists?: boolean): Promise<void>;
    exists(): Promise<boolean>;
    static cast(name: string, context: CastingContext<Directory>): Directory;
}
