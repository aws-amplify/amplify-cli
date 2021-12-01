import { ComponentWithChildrenRendererBase, FrontendManagerNode, FrontendManagerComponent, FrontendManagerComponentChild } from './codegen-ui';
import { JsxElement, JsxChild, JsxOpeningElement } from 'typescript';
import { ImportCollection } from './import-collection';
export declare class ReactComponentWithChildrenRenderer<TPropIn> extends ComponentWithChildrenRendererBase<TPropIn, JsxElement, JsxChild> {
    protected importCollection: ImportCollection;
    protected parent?: FrontendManagerNode | undefined;
    constructor(component: FrontendManagerComponent | FrontendManagerComponentChild, importCollection: ImportCollection, parent?: FrontendManagerNode | undefined);
    renderElement(renderChildren: (children: FrontendManagerComponentChild[]) => JsxChild[]): JsxElement;
    protected renderOpeningElement(): JsxOpeningElement;
    protected renderCollectionOpeningElement(itemsVariableName?: string): JsxOpeningElement;
    private addPropsSpreadAttributes;
    private addBoundExpressionAttributes;
    private mapSyntheticProps;
}
