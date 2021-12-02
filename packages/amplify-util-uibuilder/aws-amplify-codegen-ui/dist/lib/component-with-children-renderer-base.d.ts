import { BadgeProps, ButtonProps, FlexProps, CardProps, ViewProps as BoxProps } from '@aws-amplify/ui-react';
import { FrontendManagerComponentChild } from './types';
import { CommonComponentRenderer } from './common-component-renderer';
declare type SourceProp = BoxProps | BadgeProps | ButtonProps | CardProps | FlexProps;
export declare abstract class ComponentWithChildrenRendererBase<TPropIn extends SourceProp, TElementOut, TElementChild> extends CommonComponentRenderer<TPropIn> {
    abstract renderElement(renderChildren: (children: FrontendManagerComponentChild[], component?: TElementOut) => TElementChild[]): TElementOut;
}
export {};
