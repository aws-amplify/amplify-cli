import { ComponentRendererBase, FrontendManagerNode, FrontendManagerComponent, FrontendManagerComponentChild } from './codegen-ui';
import { JsxElement, JsxOpeningElement, JsxSelfClosingElement } from 'typescript';
import { ImportCollection } from './import-collection';
export declare class ReactComponentRenderer<TPropIn> extends ComponentRendererBase<TPropIn, JsxElement | JsxSelfClosingElement> {
    protected importCollection: ImportCollection;
    protected parent?: FrontendManagerNode | undefined;
    constructor(component: FrontendManagerComponent | FrontendManagerComponentChild, importCollection: ImportCollection, parent?: FrontendManagerNode | undefined);
    renderElement(): JsxElement | JsxSelfClosingElement;
    protected renderOpeningElement(): JsxOpeningElement;
    private addPropsSpreadAttributes;
}
