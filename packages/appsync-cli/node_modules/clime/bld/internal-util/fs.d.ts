/// <reference types="node" />
import * as FS from 'fs';
export declare function safeStat(path: string): Promise<FS.Stats | undefined>;
export declare function existsFile(path: string): Promise<boolean>;
export declare function existsDir(path: string): Promise<boolean>;
