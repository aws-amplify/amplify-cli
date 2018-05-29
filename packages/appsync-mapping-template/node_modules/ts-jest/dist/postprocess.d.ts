import { CompilerOptions } from 'typescript/lib/typescript';
import { FullJestConfig, JestConfig, PostProcessHook, TransformOptions, TsJestConfig } from './jest-types';
export declare function postProcessCode(compilerOptions: CompilerOptions, jestConfig: JestConfig, tsJestConfig: TsJestConfig, transformOptions: TransformOptions, transpiledText: string, filePath: string): string;
export declare const getPostProcessHook: (tsCompilerOptions: CompilerOptions, jestConfig: Partial<FullJestConfig>, tsJestConfig: TsJestConfig) => PostProcessHook;
