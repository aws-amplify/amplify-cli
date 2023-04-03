import { GraphQLResolveInfo } from 'graphql';
export declare class TemplateSentError extends Error {
    message: string;
    errorType: string;
    data: any;
    errorInfo: any;
    extensions: any;
    constructor(message: string, errorType: string, data: any, errorInfo: any, info: GraphQLResolveInfo);
}
export declare class Unauthorized extends TemplateSentError {
    constructor(gqlMessage: any, info: GraphQLResolveInfo);
}
export declare class ValidateError extends TemplateSentError {
    message: string;
    type: string;
    data: any;
    constructor(message: string, info: GraphQLResolveInfo, type?: string, data?: any);
}
//# sourceMappingURL=errors.d.ts.map