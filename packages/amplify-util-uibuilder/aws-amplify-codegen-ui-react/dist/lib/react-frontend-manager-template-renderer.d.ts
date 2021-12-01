import { FrontendManagerTemplateRenderer, FrontendManagerComponent } from './codegen-ui';
import { FunctionDeclaration, JsxElement, JsxFragment, TypeAliasDeclaration, VariableStatement, JsxSelfClosingElement } from 'typescript';
import { ImportCollection } from './import-collection';
import { ReactOutputManager } from './react-output-manager';
import { ReactRenderConfig } from './react-render-config';
import { defaultRenderConfig } from './react-frontend-manager-template-renderer-helper';
import { RequiredKeys } from './utils/type-utils';
export declare abstract class ReactFrontendManagerTemplateRenderer extends FrontendManagerTemplateRenderer<string, FrontendManagerComponent, ReactOutputManager, {
    componentText: string;
    renderComponentToFilesystem: (outputPath: string) => Promise<void>;
}> {
    protected importCollection: ImportCollection;
    protected renderConfig: RequiredKeys<ReactRenderConfig, keyof typeof defaultRenderConfig>;
    fileName: string;
    constructor(component: FrontendManagerComponent, renderConfig: ReactRenderConfig);
    renderSampleCodeSnippet(): {
        compText: string;
        importsText: string;
    };
    renderComponentOnly(): {
        compText: string;
        importsText: string;
    };
    renderComponentInternal(): {
        componentText: string;
        declaration: string | undefined;
        renderComponentToFilesystem: (outputPath: string) => Promise<void>;
    };
    renderFunctionWrapper(componentName: string, jsx: JsxElement | JsxFragment | JsxSelfClosingElement, renderExport: boolean): FunctionDeclaration;
    renderAppWrapper(appName: string, jsx: JsxElement | JsxFragment | JsxSelfClosingElement): VariableStatement;
    renderSampleCodeSnippetJsx(component: FrontendManagerComponent): JsxElement | JsxFragment | JsxSelfClosingElement;
    renderBindingPropsType(component: FrontendManagerComponent): TypeAliasDeclaration;
    private buildBasePropNode;
    /**
     * This builder is responsible primarily for identifying the variant options, partioning them into
     * required and optional parameters, then building the appropriate property signature based on that.
     * e.g.
       {
         variant?: "primary" | "secondary",
         size?: "large",
       }
     */
    private buildVariantPropNode;
    private buildComponentPropNode;
    private buildVariableStatements;
    private buildUseAuthenticatedUserStatement;
    /**
     * const variants = [
       {
         variantValues: { variant: 'primary' },
         overrides: { Button: { fontSize: '12px' } },
       },
       {
         variantValues: { variant: 'secondary' },
         overrides: { Button: { fontSize: '40px' } }
       }
     ];
     */
    private buildVariantDeclaration;
    private buildMergeOverridesFunction;
    /**
     * case: hasVariants = true => const overrides = { ...getOverridesFromVariants(variants, props) };
     * case: hasVariants = false => const overrides = { ...overridesProp };
     */
    private buildOverridesDeclaration;
    private buildCollectionBindingStatements;
    private buildCreateDataStorePredicateCall;
    private buildUseDataStoreBindingStatements;
    private buildPropPrecedentStatement;
    /**
     * const buttonUserSort = {
     *   sort: (s: SortPredicate<User>) => s.firstName('DESCENDING').lastName('ASCENDING')
     * }
     */
    private buildPaginationStatement;
    /**
     * (s: SortPredicate<User>) => s.firstName('ASCENDING').lastName('DESCENDING')
     */
    private buildSortFunction;
    private buildUseActionsStatement;
    private buildUseDataStoreBindingCall;
    private predicateToObjectLiteralExpression;
    private actionsToObjectLiteralExpression;
    private buildPredicateDeclaration;
    private hasCollectionPropertyNamedItems;
    private getPaginationName;
    private getFilterObjName;
    private getFilterName;
    private getDataStoreName;
    private getPropsTypeName;
    private dropMissingListElements;
    private getDefaultValue;
    abstract renderJsx(component: FrontendManagerComponent): JsxElement | JsxFragment | JsxSelfClosingElement;
}
