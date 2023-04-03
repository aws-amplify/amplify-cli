import { $TSContext } from '../index';
export declare const generateOverrideSkeleton: (context: $TSContext, srcResourceDirPath: string, destDirPath: string) => Promise<void>;
export declare const buildOverrideDir: (cwd: string, destDirPath: string) => Promise<boolean>;
export declare const generateAmplifyOverrideProjectBuildFiles: (backendDir: string, srcResourceDirPath: string) => void;
export declare const generateTsConfigforProject: (srcResourceDirPath: string, destDirPath: string) => void;
//# sourceMappingURL=override-skeleton-generator.d.ts.map