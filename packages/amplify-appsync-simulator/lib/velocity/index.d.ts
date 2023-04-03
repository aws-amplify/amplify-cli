import { AppSyncVTLTemplate } from '../type-definition';
import { AmplifyAppSyncSimulator } from '..';
import { AppSyncGraphQLExecutionContext } from '../utils';
import { GraphQLResolveInfo } from 'graphql';
export type AppSyncSimulatorRequestContext = {
    jwt?: {
        iss?: string;
        sub?: string;
        'cognito:username'?: string;
    };
    request?: object;
};
export type AppSyncVTLRenderContext = {
    arguments: object;
    source: object;
    stash?: object;
    result?: any;
    prevResult?: any;
    error?: any;
};
export declare class VelocityTemplateParseError extends Error {
}
export declare class VelocityTemplate {
    private simulatorContext;
    private compiler;
    private template;
    constructor(template: AppSyncVTLTemplate, simulatorContext: AmplifyAppSyncSimulator);
    render(ctxValues: AppSyncVTLRenderContext, requestContext: AppSyncGraphQLExecutionContext, info?: GraphQLResolveInfo): {
        result: any;
        stash: any;
        args: any;
        errors: any;
        isReturn: boolean;
        hadException: boolean;
    };
    private buildRenderContext;
}
//# sourceMappingURL=index.d.ts.map