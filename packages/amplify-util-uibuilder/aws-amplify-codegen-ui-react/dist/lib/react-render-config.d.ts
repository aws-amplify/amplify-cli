import { FrameworkRenderConfig } from './codegen-ui';
import { ScriptKind, ScriptTarget, ModuleKind } from 'typescript';
export { ScriptKind, ScriptTarget, ModuleKind } from 'typescript';
export declare type ReactRenderConfig = FrameworkRenderConfig & {
    script?: ScriptKind;
    target?: ScriptTarget;
    module?: ModuleKind;
    renderTypeDeclarations?: boolean;
};
export declare function scriptKindToFileExtension(scriptKind: ScriptKind): string;
export declare function scriptKindToFileExtensionNonReact(scriptKind: ScriptKind): string;
