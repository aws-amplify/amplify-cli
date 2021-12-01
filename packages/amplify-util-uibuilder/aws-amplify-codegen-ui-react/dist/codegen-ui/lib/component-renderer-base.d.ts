import { DividerProps, TextProps, ImageProps } from '@aws-amplify/ui-react';
import { CommonComponentRenderer } from './common-component-renderer';
declare type SourceProp = DividerProps | ImageProps | TextProps;
/**
 * This is a base class for a renderer that renders components with no children.
 */
export declare abstract class ComponentRendererBase<TPropIn extends SourceProp, TElementOut> extends CommonComponentRenderer<TPropIn> {
    abstract renderElement(): TElementOut;
}
export {};
