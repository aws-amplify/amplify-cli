export * from './diagnose';
export * from './configure';
export * from './init';
export * from './utils';
export * from './categories';
export * from './export';
export { addFeatureFlag } from './utils/feature-flags';
export * from './cli-version-controller';
declare global {
    namespace NodeJS {
        interface Global {
            getRandomId: () => string;
        }
    }
}
export declare function getCLIPath(testingWithLatestCodebase?: boolean): string;
export declare function isTestingWithLatestCodebase(scriptRunnerPath: any): boolean;
export declare function getScriptRunnerPath(testingWithLatestCodebase?: boolean): string;
export declare function getNpxPath(): string;
export declare function getNpmPath(): string;
export declare function injectSessionToken(profileName: string): void;
export declare function npmInstall(cwd: string): void;
export declare function installAmplifyCLI(version?: string): Promise<void>;
export declare function createNewProjectDir(projectName: string, prefix?: string): Promise<string>;
export declare const createTempDir: () => string;
