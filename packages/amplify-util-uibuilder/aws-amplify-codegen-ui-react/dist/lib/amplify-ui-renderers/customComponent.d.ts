import { FrontendManagerComponentChild } from '../codegen-ui';
import { JsxChild, JsxElement } from 'typescript';
import { ReactComponentWithChildrenRenderer } from '../react-component-with-children-renderer';
export default class CustomComponentRenderer<TPropIn> extends ReactComponentWithChildrenRenderer<TPropIn> {
    renderElement(renderChildren: (children: FrontendManagerComponentChild[]) => JsxChild[]): JsxElement;
}
