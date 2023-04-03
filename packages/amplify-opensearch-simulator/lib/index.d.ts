/// <reference types="node" />
import execa from 'execa';
import { $TSAny, GetPackageAssetPaths } from '@aws-amplify/amplify-cli-core';
export declare const supportedOpenSearchVersion = "1.3.0";
export declare const relativePathToOpensearchLocal: string;
export declare const packageName = "@aws-amplify/amplify-opensearch-simulator";
type OpenSearchEmulatorOptions = {
    port?: number;
    clusterName?: string;
    nodeName?: string;
    type?: string;
    startTimeout?: number;
};
export declare class OpenSearchEmulator {
    proc: execa.ExecaChildProcess<string>;
    opts: OpenSearchEmulatorOptions;
    constructor(proc: execa.ExecaChildProcess<string>, opts: OpenSearchEmulatorOptions);
    get pid(): number | undefined;
    get port(): number | undefined;
    get url(): string;
    terminate(): Promise<void>;
}
export declare const buildArgs: (options: OpenSearchEmulatorOptions, pathToOpenSearchData: string) => string[];
export declare const launch: (pathToOpenSearchData: string, givenOptions?: OpenSearchEmulatorOptions, retry?: number, startTime?: number) => Promise<OpenSearchEmulator>;
export declare const startOpensearchEmulator: (opts: Required<OpenSearchEmulatorOptions>, proc: execa.ExecaChildProcess<string>, port: number, startTime: number, givenOptions: OpenSearchEmulatorOptions, pathToOpenSearchData: string, retry: number) => Promise<OpenSearchEmulator | undefined>;
export declare const startingEmulatorPromise: (opts: Required<OpenSearchEmulatorOptions>, proc: execa.ExecaChildProcess<string>, port: number) => Promise<unknown>;
export declare const exitingEmulatorPromise: (proc: execa.ExecaChildProcess<string>, prematureExit: $TSAny) => Promise<unknown>;
export declare const ensureOpenSearchLocalExists: (pathToOpenSearchData: string) => Promise<void>;
export declare const writeOpensearchEmulatorArtifacts: (pathToOpenSearchLocal: string, opensearchSimulatorGunZippedTarball: $TSAny, latestSig: $TSAny, latestPublicKey: $TSAny) => Promise<void>;
export declare const unzipOpensearchBuildFile: (opensearchSimulatorGunZippedTarball: Buffer, pathToOpenSearchLib: string) => Promise<void>;
export declare const openSearchLocalExists: (pathToOpenSearchLocal: string) => Promise<boolean>;
export declare const getPathToOpenSearchBinary: (pathToOpenSearchLocal?: string) => Promise<string>;
export declare const getPackageAssetPaths: GetPackageAssetPaths;
export declare const getOpensearchLocalDirectory: () => string;
export {};
//# sourceMappingURL=index.d.ts.map