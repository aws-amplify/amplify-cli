import * as tsc from 'typescript';
import { ConfigGlobals, JestConfig, TsJestConfig } from './jest-types';
import * as _ from 'lodash';
export declare function getTSJestConfig(globals: ConfigGlobals): TsJestConfig;
export declare function mockGlobalTSConfigSchema(globals: any): {
    'ts-jest': {
        tsConfigFile: string;
    };
};
export declare const getTSConfig: ((globals: any, rootDir?: string) => tsc.CompilerOptions) & _.MemoizedFunction;
export declare function cacheFile(jestConfig: JestConfig, filePath: string, src: string): void;
export declare function injectSourcemapHook(filePath: string, typeScriptCode: string, src: string): string;
export declare function runTsDiagnostics(filePath: string, compilerOptions: tsc.CompilerOptions): void;
