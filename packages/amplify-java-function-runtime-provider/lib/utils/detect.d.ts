import { CheckDependenciesResult } from '@aws-amplify/amplify-function-plugin-interface';
export declare const checkJava: () => Promise<CheckDependenciesResult>;
export declare const checkGradle: () => Promise<CheckDependenciesResult>;
export declare const checkJavaCompiler: () => Promise<{
    hasRequiredDependencies: boolean;
    errorMessage: string;
} | {
    hasRequiredDependencies: boolean;
    errorMessage?: undefined;
}>;
//# sourceMappingURL=detect.d.ts.map