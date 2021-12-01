"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBindingPropertiesImports = exports.buildOpeningElementActions = exports.buildOpeningElementAttributes = exports.buildChildElement = exports.buildConditionalAttr = exports.buildConditionalExpression = exports.getConditionalOperandExpression = exports.getSyntaxKindToken = exports.resolvePropToExpression = exports.buildConcatAttr = exports.buildConcatExpression = exports.buildCollectionBindingAttrWithDefault = exports.buildCollectionBindingWithDefaultExpression = exports.buildCollectionBindingAttr = exports.buildCollectionBindingExpression = exports.buildFixedAttr = exports.buildFixedJsxExpression = exports.buildBindingAttrWithDefault = exports.buildBindingWithDefaultExpression = exports.buildBindingAttr = exports.buildBindingExpression = exports.isDefaultValueOnly = exports.isConditionalProperty = exports.isConcatenatedProperty = exports.isCollectionItemBoundProperty = exports.isBoundProperty = exports.isFixedPropertyWithValue = exports.getComponentPropName = exports.getFixedComponentPropValueExpression = void 0;
const typescript_1 = require("typescript");
const react_frontend_manager_template_renderer_helper_1 = require("./react-frontend-manager-template-renderer-helper");
function getFixedComponentPropValueExpression(prop) {
    return typescript_1.factory.createStringLiteral(prop.value.toString(), true);
}
exports.getFixedComponentPropValueExpression = getFixedComponentPropValueExpression;
function getComponentPropName(componentName) {
    if (componentName !== undefined) {
        return `${componentName}Props`;
    }
    return 'ComponentWithoutNameProps';
}
exports.getComponentPropName = getComponentPropName;
function isFixedPropertyWithValue(prop) {
    return 'value' in prop;
}
exports.isFixedPropertyWithValue = isFixedPropertyWithValue;
function isBoundProperty(prop) {
    return 'bindingProperties' in prop;
}
exports.isBoundProperty = isBoundProperty;
function isCollectionItemBoundProperty(prop) {
    return 'collectionBindingProperties' in prop;
}
exports.isCollectionItemBoundProperty = isCollectionItemBoundProperty;
function isConcatenatedProperty(prop) {
    return 'concat' in prop;
}
exports.isConcatenatedProperty = isConcatenatedProperty;
function isConditionalProperty(prop) {
    return 'condition' in prop;
}
exports.isConditionalProperty = isConditionalProperty;
function isDefaultValueOnly(prop) {
    return 'defaultValue' in prop && !(isCollectionItemBoundProperty(prop) || isBoundProperty(prop));
}
exports.isDefaultValueOnly = isDefaultValueOnly;
/**
 * case: has field => <prop.bindingProperties.property>?.<prop.bindingProperties.field>
 * case: no field =>  <prop.bindingProperties.property>
 */
function buildBindingExpression(prop) {
    return prop.bindingProperties.field === undefined
        ? typescript_1.factory.createIdentifier(prop.bindingProperties.property)
        : typescript_1.factory.createPropertyAccessChain(typescript_1.factory.createIdentifier(prop.bindingProperties.property), typescript_1.factory.createToken(typescript_1.SyntaxKind.QuestionDotToken), prop.bindingProperties.field);
}
exports.buildBindingExpression = buildBindingExpression;
function buildBindingAttr(prop, propName) {
    const expr = buildBindingExpression(prop);
    return typescript_1.factory.createJsxAttribute(typescript_1.factory.createIdentifier(propName), typescript_1.factory.createJsxExpression(undefined, expr));
}
exports.buildBindingAttr = buildBindingAttr;
function buildBindingWithDefaultExpression(prop, defaultValue) {
    const rightExpr = typescript_1.factory.createStringLiteral(defaultValue);
    const leftExpr = prop.bindingProperties.field === undefined
        ? typescript_1.factory.createIdentifier(prop.bindingProperties.property)
        : typescript_1.factory.createPropertyAccessChain(typescript_1.factory.createIdentifier(prop.bindingProperties.property), typescript_1.factory.createToken(typescript_1.SyntaxKind.QuestionDotToken), prop.bindingProperties.field);
    return typescript_1.factory.createBinaryExpression(leftExpr, typescript_1.factory.createToken(typescript_1.SyntaxKind.BarBarToken), rightExpr);
}
exports.buildBindingWithDefaultExpression = buildBindingWithDefaultExpression;
function buildBindingAttrWithDefault(prop, propName, defaultValue) {
    const binaryExpr = buildBindingWithDefaultExpression(prop, defaultValue);
    return typescript_1.factory.createJsxAttribute(typescript_1.factory.createIdentifier(propName), typescript_1.factory.createJsxExpression(undefined, binaryExpr));
}
exports.buildBindingAttrWithDefault = buildBindingAttrWithDefault;
function buildFixedJsxExpression(prop) {
    const { value, type } = prop;
    switch (typeof value) {
        case 'number':
            return typescript_1.factory.createJsxExpression(undefined, typescript_1.factory.createNumericLiteral(value, undefined));
        case 'boolean':
            return typescript_1.factory.createJsxExpression(undefined, value ? typescript_1.factory.createTrue() : typescript_1.factory.createFalse());
        case 'string':
            switch (type) {
                case undefined:
                    return typescript_1.factory.createStringLiteral(value);
                case 'String':
                    return typescript_1.factory.createStringLiteral(value);
                case 'Object':
                case 'Number':
                case 'Boolean':
                    try {
                        const parsedValue = JSON.parse(value);
                        if (typeof parsedValue === 'number') {
                            return typescript_1.factory.createJsxExpression(undefined, typescript_1.factory.createNumericLiteral(parsedValue, undefined));
                        }
                        if (typeof parsedValue === 'boolean') {
                            return typescript_1.factory.createJsxExpression(undefined, parsedValue ? typescript_1.factory.createTrue() : typescript_1.factory.createFalse());
                        }
                        // object, array, and null
                        if (typeof parsedValue === 'object') {
                            return typescript_1.factory.createJsxExpression(undefined, (0, react_frontend_manager_template_renderer_helper_1.jsonToLiteral)(parsedValue));
                        }
                    }
                    catch (_a) { } // eslint-disable-line no-empty
                    throw new Error(`Failed to parse value "${value}" as type ${type}`);
                default:
                    throw new Error(`Invalid type ${type} for "${value}"`);
            }
        default:
            throw new Error(`Invalid type ${typeof value} for "${value}"`);
    }
}
exports.buildFixedJsxExpression = buildFixedJsxExpression;
function buildFixedAttr(prop, propName) {
    const expr = buildFixedJsxExpression(prop);
    return typescript_1.factory.createJsxAttribute(typescript_1.factory.createIdentifier(propName), expr);
}
exports.buildFixedAttr = buildFixedAttr;
function buildCollectionBindingExpression(prop) {
    return prop.collectionBindingProperties.field === undefined
        ? typescript_1.factory.createIdentifier('item')
        : typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier('item'), prop.collectionBindingProperties.field);
}
exports.buildCollectionBindingExpression = buildCollectionBindingExpression;
function buildCollectionBindingAttr(prop, propName) {
    const expr = buildCollectionBindingExpression(prop);
    const attr = typescript_1.factory.createJsxAttribute(typescript_1.factory.createIdentifier(propName), typescript_1.factory.createJsxExpression(undefined, expr));
    return attr;
}
exports.buildCollectionBindingAttr = buildCollectionBindingAttr;
function buildCollectionBindingWithDefaultExpression(prop, defaultValue) {
    const rightExpr = typescript_1.factory.createStringLiteral(defaultValue);
    const leftExpr = prop.collectionBindingProperties.field === undefined
        ? typescript_1.factory.createIdentifier('item')
        : typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier('item'), prop.collectionBindingProperties.field);
    return typescript_1.factory.createBinaryExpression(leftExpr, typescript_1.factory.createToken(typescript_1.SyntaxKind.BarBarToken), rightExpr);
}
exports.buildCollectionBindingWithDefaultExpression = buildCollectionBindingWithDefaultExpression;
function buildCollectionBindingAttrWithDefault(prop, propName, defaultValue) {
    const binaryExpr = buildCollectionBindingWithDefaultExpression(prop, defaultValue);
    const attr = typescript_1.factory.createJsxAttribute(typescript_1.factory.createIdentifier(propName), typescript_1.factory.createJsxExpression(undefined, binaryExpr));
    return attr;
}
exports.buildCollectionBindingAttrWithDefault = buildCollectionBindingAttrWithDefault;
function buildConcatExpression(prop) {
    const expressions = [];
    prop.concat.forEach((propItem) => {
        if (isFixedPropertyWithValue(propItem)) {
            expressions.push(buildFixedJsxExpression(propItem));
        }
        else if (isBoundProperty(propItem)) {
            const expr = propItem.defaultValue === undefined
                ? buildBindingExpression(propItem)
                : buildBindingWithDefaultExpression(propItem, propItem.defaultValue);
            expressions.push(expr);
        }
        else if (isCollectionItemBoundProperty(propItem)) {
            const expr = propItem.defaultValue === undefined
                ? buildCollectionBindingExpression(propItem)
                : buildCollectionBindingWithDefaultExpression(propItem, propItem.defaultValue);
            expressions.push(expr);
        }
        else if (isConcatenatedProperty(propItem)) {
            expressions.push(buildConcatExpression(propItem));
        }
    });
    const templateSpans = [];
    expressions.forEach((expr, index) => {
        const span = index === expressions.length - 1
            ? typescript_1.factory.createTemplateSpan(expr, typescript_1.factory.createTemplateTail('', ''))
            : typescript_1.factory.createTemplateSpan(expr, typescript_1.factory.createTemplateMiddle('', ''));
        templateSpans.push(span);
    });
    return typescript_1.factory.createTemplateExpression(typescript_1.factory.createTemplateHead('', ''), templateSpans);
}
exports.buildConcatExpression = buildConcatExpression;
function buildConcatAttr(prop, propName) {
    const expr = buildConcatExpression(prop);
    return typescript_1.factory.createJsxAttribute(typescript_1.factory.createIdentifier(propName), typescript_1.factory.createJsxExpression(undefined, expr));
}
exports.buildConcatAttr = buildConcatAttr;
function resolvePropToExpression(prop) {
    if (isFixedPropertyWithValue(prop)) {
        const propValue = prop.value;
        switch (typeof propValue) {
            case 'number':
                return typescript_1.factory.createNumericLiteral(propValue, undefined);
            case 'boolean':
                return propValue ? typescript_1.factory.createTrue() : typescript_1.factory.createFalse();
            default:
                return typescript_1.factory.createStringLiteral(propValue.toString(), undefined);
        }
    }
    if (isBoundProperty(prop)) {
        const expr = prop.defaultValue === undefined
            ? buildBindingExpression(prop)
            : buildBindingWithDefaultExpression(prop, prop.defaultValue);
        return expr;
    }
    if (isCollectionItemBoundProperty(prop)) {
        const expr = prop.defaultValue === undefined
            ? buildCollectionBindingExpression(prop)
            : buildCollectionBindingWithDefaultExpression(prop, prop.defaultValue);
        return expr;
    }
    if (isConcatenatedProperty(prop)) {
        return buildConcatExpression(prop);
    }
    if (isConditionalProperty(prop)) {
        return buildConditionalExpression(prop);
    }
    return typescript_1.factory.createVoidZero();
}
exports.resolvePropToExpression = resolvePropToExpression;
function getSyntaxKindToken(operator) {
    switch (operator) {
        case 'eq':
            return typescript_1.factory.createToken(typescript_1.SyntaxKind.EqualsEqualsToken);
        case 'ne':
            return typescript_1.factory.createToken(typescript_1.SyntaxKind.ExclamationEqualsToken);
        case 'le':
            return typescript_1.factory.createToken(typescript_1.SyntaxKind.LessThanEqualsToken);
        case 'lt':
            return typescript_1.factory.createToken(typescript_1.SyntaxKind.LessThanToken);
        case 'ge':
            return typescript_1.factory.createToken(typescript_1.SyntaxKind.GreaterThanEqualsToken);
        case 'gt':
            return typescript_1.factory.createToken(typescript_1.SyntaxKind.GreaterThanToken);
        default:
            return undefined;
    }
}
exports.getSyntaxKindToken = getSyntaxKindToken;
function getConditionalOperandExpression(operand) {
    switch (typeof operand) {
        case 'number':
            return typescript_1.factory.createNumericLiteral(operand);
        case 'boolean':
            return operand ? typescript_1.factory.createTrue() : typescript_1.factory.createFalse();
        default:
            return typescript_1.factory.createStringLiteral(operand);
    }
}
exports.getConditionalOperandExpression = getConditionalOperandExpression;
function buildConditionalExpression(prop) {
    const { property, field, operand, operator, then } = prop.condition;
    const elseBlock = prop.condition.else;
    const operatorToken = getSyntaxKindToken(operator);
    if (operatorToken === undefined) {
        return typescript_1.factory.createJsxExpression(undefined, undefined);
    }
    const propertyAccess = field !== undefined
        ? typescript_1.factory.createPropertyAccessChain(typescript_1.factory.createIdentifier(property), typescript_1.factory.createToken(typescript_1.SyntaxKind.QuestionDotToken), typescript_1.factory.createIdentifier(field))
        : typescript_1.factory.createIdentifier(property);
    return typescript_1.factory.createJsxExpression(undefined, typescript_1.factory.createConditionalExpression(typescript_1.factory.createParenthesizedExpression(typescript_1.factory.createBinaryExpression(propertyAccess, typescript_1.factory.createToken(typescript_1.SyntaxKind.AmpersandAmpersandToken), typescript_1.factory.createBinaryExpression(propertyAccess, operatorToken, getConditionalOperandExpression(operand)))), typescript_1.factory.createToken(typescript_1.SyntaxKind.QuestionToken), resolvePropToExpression(then), typescript_1.factory.createToken(typescript_1.SyntaxKind.ColonToken), resolvePropToExpression(elseBlock)));
}
exports.buildConditionalExpression = buildConditionalExpression;
function buildConditionalAttr(prop, propName) {
    const expr = buildConditionalExpression(prop);
    return typescript_1.factory.createJsxAttribute(typescript_1.factory.createIdentifier(propName), expr);
}
exports.buildConditionalAttr = buildConditionalAttr;
function buildChildElement(prop) {
    if (!prop) {
        return undefined;
    }
    let expression;
    if (isFixedPropertyWithValue(prop)) {
        expression = buildFixedJsxExpression(prop);
    }
    if (isBoundProperty(prop)) {
        expression =
            prop.defaultValue === undefined
                ? buildBindingExpression(prop)
                : buildBindingWithDefaultExpression(prop, prop.defaultValue);
    }
    if (isCollectionItemBoundProperty(prop)) {
        expression =
            prop.defaultValue === undefined
                ? buildCollectionBindingExpression(prop)
                : buildCollectionBindingWithDefaultExpression(prop, prop.defaultValue);
    }
    if (isConcatenatedProperty(prop)) {
        expression = buildConcatExpression(prop);
    }
    if (isConditionalProperty(prop)) {
        expression = buildConditionalExpression(prop);
    }
    return expression && typescript_1.factory.createJsxExpression(undefined, expression);
}
exports.buildChildElement = buildChildElement;
function buildOpeningElementAttributes(prop, propName) {
    if (isFixedPropertyWithValue(prop)) {
        return buildFixedAttr(prop, propName);
    }
    if (isBoundProperty(prop)) {
        return prop.defaultValue === undefined
            ? buildBindingAttr(prop, propName)
            : buildBindingAttrWithDefault(prop, propName, prop.defaultValue);
    }
    if (isCollectionItemBoundProperty(prop)) {
        return prop.defaultValue === undefined
            ? buildCollectionBindingAttr(prop, propName)
            : buildCollectionBindingAttrWithDefault(prop, propName, prop.defaultValue);
    }
    if (isConcatenatedProperty(prop)) {
        return buildConcatAttr(prop, propName);
    }
    if (isConditionalProperty(prop)) {
        return buildConditionalAttr(prop, propName);
    }
    return typescript_1.factory.createJsxAttribute(typescript_1.factory.createIdentifier(propName), undefined);
}
exports.buildOpeningElementAttributes = buildOpeningElementAttributes;
/* Tempory stub function to map from generic event name to React event name. Final implementation will be included in
 * amplify-ui.
 */
function mapGenericEventToReact(genericEventBinding) {
    switch (genericEventBinding) {
        case 'click':
            return 'onClick';
        default:
            throw new Error(`${genericEventBinding} is not a possible event.`);
    }
}
/* Build React attribute for actions
 *
 * Example: onClick={invokeAction("signOutAction")}
 */
function buildOpeningElementActions(genericEventBinding, action) {
    // TODO: map from generic to platform
    const reactActionBinding = mapGenericEventToReact(genericEventBinding);
    return typescript_1.factory.createJsxAttribute(typescript_1.factory.createIdentifier(reactActionBinding), typescript_1.factory.createJsxExpression(undefined, typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier('invokeAction'), undefined, [
        typescript_1.factory.createStringLiteral(action),
    ])));
}
exports.buildOpeningElementActions = buildOpeningElementActions;
function addBindingPropertiesImports(component, importCollection) {
    if ('bindingProperties' in component) {
        Object.entries(component.bindingProperties).forEach(([, binding]) => {
            if ('bindingProperties' in binding && 'model' in binding.bindingProperties) {
                importCollection.addImport('../models', binding.bindingProperties.model);
            }
        });
    }
}
exports.addBindingPropertiesImports = addBindingPropertiesImports;
//# sourceMappingURL=react-component-render-helper.js.map