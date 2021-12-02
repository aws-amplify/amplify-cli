import { BaseComponentProps } from '@aws-amplify/ui-react';
import { JsxSelfClosingElement } from 'typescript';
import { ReactComponentRenderer } from '../react-component-renderer';
export default class SampleCodeRenderer extends ReactComponentRenderer<BaseComponentProps> {
    renderElement(): JsxSelfClosingElement;
    private addExposedPropAttributes;
    mapProps(props: BaseComponentProps): BaseComponentProps;
}
