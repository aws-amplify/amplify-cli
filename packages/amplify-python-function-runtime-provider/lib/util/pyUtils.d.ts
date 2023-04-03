/// <reference types="node" />
import { ExecOptions } from 'child_process';
export declare function getPipenvDir(srcRoot: string): Promise<string>;
export declare function majMinPyVersion(pyVersion: string): string;
export declare function execAsStringPromise(command: string, opts?: ExecOptions): Promise<string>;
export declare const getPythonBinaryName: () => string | undefined;
//# sourceMappingURL=pyUtils.d.ts.map