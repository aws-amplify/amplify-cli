import { BaseComponentProps } from '@aws-amplify/ui-react';
import { FrontendManagerComponentChild } from '../codegen-ui';
import { JsxChild, JsxElement } from 'typescript';
import { ReactComponentWithChildrenRenderer } from '../react-component-with-children-renderer';
export default class CollectionRenderer extends ReactComponentWithChildrenRenderer<BaseComponentProps> {
    renderElement(renderChildren: (children: FrontendManagerComponentChild[]) => JsxChild[]): JsxElement;
    private addKeyPropertyToChildren;
    private findItemsVariableName;
    private renderItemArrowFunctionExpr;
}
