import ts from 'typescript';
import { EnvironmentResponse, Runtime } from '@aws-sdk/client-lambda';
export interface FunctionDefinition {
    category?: string;
    entry?: string;
    name?: string;
    timeoutSeconds?: number;
    memoryMB?: number;
    environment?: EnvironmentResponse;
    runtime?: Runtime | string;
    resourceName?: string;
    schedule?: string;
}
export declare function renderFunctions(definition: FunctionDefinition, appId?: string, backendEnvironmentName?: string | undefined): ts.NodeArray<ts.Node>;
export declare function createFunctionDefinition(definition?: FunctionDefinition, postImportStatements?: (ts.CallExpression | ts.JSDoc | ts.ExpressionStatement)[], namedImports?: Record<string, Set<string>>, appId?: string, backendEnvironmentName?: string): ts.ObjectLiteralElementLike[];
//# sourceMappingURL=index.d.ts.map