import { FrontendManagerComponentDataPropertyBinding, FrontendManagerComponentSimplePropertyBinding } from './codegen-ui';
import ts, { StringLiteral, NumericLiteral, BooleanLiteral, NullLiteral, ArrayLiteralExpression, ObjectLiteralExpression } from 'typescript';
import { ReactRenderConfig } from './react-render-config';
export declare const defaultRenderConfig: {
    script: ts.ScriptKind;
    target: ts.ScriptTarget;
    module: ts.ModuleKind;
};
export declare function transpile(code: string, renderConfig: ReactRenderConfig): {
    componentText: string;
    declaration?: string;
};
export declare function buildPrinter(fileName: string, renderConfig: ReactRenderConfig): {
    printer: ts.Printer;
    file: ts.SourceFile;
};
export declare function getDeclarationFilename(filename: string): string;
export declare type json = string | number | boolean | null | json[] | {
    [key: string]: json;
};
export declare function jsonToLiteral(jsonObject: json): ObjectLiteralExpression | StringLiteral | NumericLiteral | BooleanLiteral | NullLiteral | ArrayLiteralExpression;
export declare function bindingPropertyUsesHook(binding: FrontendManagerComponentDataPropertyBinding | FrontendManagerComponentSimplePropertyBinding): boolean;
