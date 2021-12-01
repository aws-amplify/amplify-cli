import { ConcatenatedFrontendManagerComponentProperty, ConditionalFrontendManagerComponentProperty, FixedFrontendManagerComponentProperty, BoundFrontendManagerComponentProperty, CollectionFrontendManagerComponentProperty, WorkflowFrontendManagerComponentProperty, FormFrontendManagerComponentProperty, FrontendManagerComponent, FrontendManagerComponentChild } from './codegen-ui';
import { Expression, JsxAttribute, StringLiteral, JsxExpression, BinaryOperatorToken, JsxChild } from 'typescript';
import { ImportCollection } from './import-collection';
export declare function getFixedComponentPropValueExpression(prop: FixedFrontendManagerComponentProperty): StringLiteral;
export declare function getComponentPropName(componentName?: string): string;
export declare type ComponentPropertyValueTypes = ConcatenatedFrontendManagerComponentProperty | ConditionalFrontendManagerComponentProperty | FixedFrontendManagerComponentProperty | BoundFrontendManagerComponentProperty | CollectionFrontendManagerComponentProperty | WorkflowFrontendManagerComponentProperty | FormFrontendManagerComponentProperty;
export declare function isFixedPropertyWithValue(prop: ComponentPropertyValueTypes): prop is FixedFrontendManagerComponentProperty;
export declare function isBoundProperty(prop: ComponentPropertyValueTypes): prop is BoundFrontendManagerComponentProperty;
export declare function isCollectionItemBoundProperty(prop: ComponentPropertyValueTypes): prop is CollectionFrontendManagerComponentProperty;
export declare function isConcatenatedProperty(prop: ComponentPropertyValueTypes): prop is ConcatenatedFrontendManagerComponentProperty;
export declare function isConditionalProperty(prop: ComponentPropertyValueTypes): prop is ConditionalFrontendManagerComponentProperty;
export declare function isDefaultValueOnly(prop: ComponentPropertyValueTypes): prop is CollectionFrontendManagerComponentProperty | BoundFrontendManagerComponentProperty;
/**
 * case: has field => <prop.bindingProperties.property>?.<prop.bindingProperties.field>
 * case: no field =>  <prop.bindingProperties.property>
 */
export declare function buildBindingExpression(prop: BoundFrontendManagerComponentProperty): Expression;
export declare function buildBindingAttr(prop: BoundFrontendManagerComponentProperty, propName: string): JsxAttribute;
export declare function buildBindingWithDefaultExpression(prop: BoundFrontendManagerComponentProperty, defaultValue: string): Expression;
export declare function buildBindingAttrWithDefault(prop: BoundFrontendManagerComponentProperty, propName: string, defaultValue: string): JsxAttribute;
export declare function buildFixedJsxExpression(prop: FixedFrontendManagerComponentProperty): StringLiteral | JsxExpression;
export declare function buildFixedAttr(prop: FixedFrontendManagerComponentProperty, propName: string): JsxAttribute;
export declare function buildCollectionBindingExpression(prop: CollectionFrontendManagerComponentProperty): Expression;
export declare function buildCollectionBindingAttr(prop: CollectionFrontendManagerComponentProperty, propName: string): JsxAttribute;
export declare function buildCollectionBindingWithDefaultExpression(prop: CollectionFrontendManagerComponentProperty, defaultValue: string): Expression;
export declare function buildCollectionBindingAttrWithDefault(prop: CollectionFrontendManagerComponentProperty, propName: string, defaultValue: string): JsxAttribute;
export declare function buildConcatExpression(prop: ConcatenatedFrontendManagerComponentProperty): Expression;
export declare function buildConcatAttr(prop: ConcatenatedFrontendManagerComponentProperty, propName: string): JsxAttribute;
export declare function resolvePropToExpression(prop: ComponentPropertyValueTypes): Expression;
export declare function getSyntaxKindToken(operator: string): BinaryOperatorToken | undefined;
export declare function getConditionalOperandExpression(operand: string | number | boolean): Expression;
export declare function buildConditionalExpression(prop: ConditionalFrontendManagerComponentProperty): JsxExpression;
export declare function buildConditionalAttr(prop: ConditionalFrontendManagerComponentProperty, propName: string): JsxAttribute;
export declare function buildChildElement(prop?: ComponentPropertyValueTypes): JsxChild | undefined;
export declare function buildOpeningElementAttributes(prop: ComponentPropertyValueTypes, propName: string): JsxAttribute;
export declare function buildOpeningElementActions(genericEventBinding: string, action: string): JsxAttribute;
export declare function addBindingPropertiesImports(component: FrontendManagerComponent | FrontendManagerComponentChild, importCollection: ImportCollection): void;
