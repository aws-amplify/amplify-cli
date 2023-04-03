import { AuthContext } from '../../../context';
declare module 'enquirer' {
    class Sort {
        constructor(sortParameters: any);
        run(): Promise<string[]>;
    }
}
export declare const serviceWalkthrough: (context: AuthContext, defaultValuesFilename: any, stringMapsFilename: any, serviceMetadata: any, coreAnswers?: {
    [key: string]: any;
}) => Promise<Record<string, unknown>>;
export declare const identityPoolProviders: (coreAnswers: any, projectType: any) => any;
export declare const userPoolProviders: (oAuthProviders: any, coreAnswers: any, prevAnswers?: any) => any;
export declare const structureOAuthMetadata: (coreAnswers: any, context: AuthContext, defaults: any, amplify: any) => any;
export declare const parseOAuthCreds: (providers: string[], metadata: any, envCreds: any) => Record<string, unknown>;
export declare const getIAMPolicies: (context: AuthContext, resourceName: any, crudOptions: any) => any;
//# sourceMappingURL=auth-questions.d.ts.map