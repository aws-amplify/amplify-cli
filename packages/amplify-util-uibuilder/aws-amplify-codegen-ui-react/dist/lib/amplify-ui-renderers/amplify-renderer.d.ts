import { FrontendManagerNode, FrontendManagerComponent, FrontendManagerComponentChild } from '../codegen-ui';
import { JsxElement, JsxFragment, JsxSelfClosingElement } from 'typescript';
import { ReactFrontendManagerTemplateRenderer } from '../react-frontend-manager-template-renderer';
export declare class AmplifyRenderer extends ReactFrontendManagerTemplateRenderer {
    renderJsx(component: FrontendManagerComponent | FrontendManagerComponentChild, parent?: FrontendManagerNode): JsxElement | JsxFragment | JsxSelfClosingElement;
}
