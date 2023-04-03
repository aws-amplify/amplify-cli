import { CheckDependenciesResult, PackageRequest, PackageResult, BuildRequest, BuildResult } from '@aws-amplify/amplify-function-plugin-interface';
import { SemVer } from 'semver';
export declare const executeCommand: (args: string[], streamStdio: boolean, env?: Record<string, string>, cwd?: string | undefined, stdioInput?: string | undefined) => string;
export declare const buildResource: ({ buildType, srcRoot, lastBuildTimeStamp }: BuildRequest) => Promise<BuildResult>;
export declare const getGoVersion: () => SemVer;
export declare const checkDependencies: () => Promise<CheckDependenciesResult>;
export declare const packageResource: (request: PackageRequest, context: any) => Promise<PackageResult>;
//# sourceMappingURL=runtime.d.ts.map