import { BaseError } from 'make-error';
import * as TS from 'typescript';
export interface TSCommon {
    version: typeof TS.version;
    sys: typeof TS.sys;
    ScriptSnapshot: typeof TS.ScriptSnapshot;
    displayPartsToString: typeof TS.displayPartsToString;
    createLanguageService: typeof TS.createLanguageService;
    getDefaultLibFilePath: typeof TS.getDefaultLibFilePath;
    getPreEmitDiagnostics: typeof TS.getPreEmitDiagnostics;
    flattenDiagnosticMessageText: typeof TS.flattenDiagnosticMessageText;
    transpileModule: typeof TS.transpileModule;
    ModuleKind: typeof TS.ModuleKind;
    ScriptTarget: typeof TS.ScriptTarget;
    findConfigFile: typeof TS.findConfigFile;
    readConfigFile: typeof TS.readConfigFile;
    parseJsonConfigFileContent: typeof TS.parseJsonConfigFileContent;
}
export declare const VERSION: any;
export interface Options {
    typeCheck?: boolean | null;
    cache?: boolean | null;
    cacheDirectory?: string;
    compiler?: string;
    ignore?: string | string[];
    project?: string;
    skipIgnore?: boolean | null;
    skipProject?: boolean | null;
    compilerOptions?: object;
    ignoreDiagnostics?: number | string | Array<number | string>;
    readFile?: (path: string) => string | undefined;
    fileExists?: (path: string) => boolean;
    transformers?: TS.CustomTransformers;
}
export interface TypeInfo {
    name: string;
    comment: string;
}
export declare const DEFAULTS: Options;
export declare function split(value: string | undefined): string[] | undefined;
export declare function parse(value: string | undefined): object | undefined;
export declare function normalizeSlashes(value: string): string;
export declare class TSError extends BaseError {
    diagnostics: TSDiagnostic[];
    name: string;
    constructor(diagnostics: TSDiagnostic[]);
}
export interface Register {
    cwd: string;
    extensions: string[];
    cachedir: string;
    ts: TSCommon;
    compile(code: string, fileName: string, lineOffset?: number): string;
    getTypeInfo(code: string, fileName: string, position: number): TypeInfo;
}
export declare function register(opts?: Options): Register;
export declare function formatDiagnostics(diagnostics: TS.Diagnostic[], cwd: string, ts: TSCommon, lineOffset: number): TSDiagnostic[];
export interface TSDiagnostic {
    message: string;
    code: number;
}
export declare function formatDiagnostic(diagnostic: TS.Diagnostic, cwd: string, ts: TSCommon, lineOffset: number): TSDiagnostic;
export declare function printError(error: TSError): string;
