import * as ts from 'typescript';
import { TsJestConfig } from './jest-types';
export declare function transpileTypescript(filePath: string, fileSrc: string, compilerOptions: ts.CompilerOptions, tsJestConfig: TsJestConfig): string;
