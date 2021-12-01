"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactFrontendManagerTemplateRenderer = void 0;
/*
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 */
const codegen_ui_1 = require("./codegen-ui");
const os_1 = require("os");
const typescript_1 = __importStar(require("typescript"));
const import_collection_1 = require("./import-collection");
const react_output_manager_1 = require("./react-output-manager");
const react_render_config_1 = require("./react-render-config");
const sampleCodeRenderer_1 = __importDefault(require("./amplify-ui-renderers/sampleCodeRenderer"));
const react_component_render_helper_1 = require("./react-component-render-helper");
const react_frontend_manager_template_renderer_helper_1 = require("./react-frontend-manager-template-renderer-helper");
const primitive_1 = __importStar(require("./primitive"));
class ReactFrontendManagerTemplateRenderer extends codegen_ui_1.FrontendManagerTemplateRenderer {
    constructor(component, renderConfig) {
        super(component, new react_output_manager_1.ReactOutputManager(), renderConfig);
        this.importCollection = new import_collection_1.ImportCollection();
        this.fileName = `${this.component.name}.tsx`;
        this.renderConfig = {
            ...react_frontend_manager_template_renderer_helper_1.defaultRenderConfig,
            ...renderConfig,
        };
        this.fileName = `${this.component.name}.${(0, react_render_config_1.scriptKindToFileExtension)(this.renderConfig.script)}`;
        // TODO: throw warnings on invalid config combinations. i.e. CommonJS + JSX
    }
    renderSampleCodeSnippet() {
        var _a;
        const jsx = this.renderSampleCodeSnippetJsx(this.component);
        const imports = this.importCollection.buildSampleSnippetImports((_a = this.component.name) !== null && _a !== void 0 ? _a : codegen_ui_1.FrontendManagerRendererConstants.unknownName);
        const { printer, file } = (0, react_frontend_manager_template_renderer_helper_1.buildPrinter)(this.fileName, this.renderConfig);
        let importsText = '';
        for (const importStatement of imports) {
            const result = printer.printNode(typescript_1.EmitHint.Unspecified, importStatement, file);
            importsText += result + os_1.EOL;
        }
        const compText = printer.printNode(typescript_1.EmitHint.Unspecified, jsx, file);
        return { compText, importsText };
    }
    renderComponentOnly() {
        var _a;
        const jsx = this.renderJsx(this.component);
        const { printer, file } = (0, react_frontend_manager_template_renderer_helper_1.buildPrinter)(this.fileName, this.renderConfig);
        const imports = this.importCollection.buildImportStatements();
        let importsText = '';
        for (const importStatement of imports) {
            const result = printer.printNode(typescript_1.EmitHint.Unspecified, importStatement, file);
            importsText += result + os_1.EOL;
        }
        const wrappedFunction = this.renderFunctionWrapper((_a = this.component.name) !== null && _a !== void 0 ? _a : codegen_ui_1.FrontendManagerRendererConstants.unknownName, jsx, false);
        const result = printer.printNode(typescript_1.EmitHint.Unspecified, wrappedFunction, file);
        // do not produce declaration becuase it is not used
        const { componentText: compText } = (0, react_frontend_manager_template_renderer_helper_1.transpile)(result, { ...this.renderConfig, renderTypeDeclarations: false });
        return { compText, importsText };
    }
    renderComponentInternal() {
        // This is a react component so we only need a single tsx
        var _a;
        const { printer, file } = (0, react_frontend_manager_template_renderer_helper_1.buildPrinter)(this.fileName, this.renderConfig);
        const jsx = this.renderJsx(this.component);
        const wrappedFunction = this.renderFunctionWrapper((_a = this.component.name) !== null && _a !== void 0 ? _a : codegen_ui_1.FrontendManagerRendererConstants.unknownName, jsx, true);
        const propsDeclaration = this.renderBindingPropsType(this.component);
        const imports = this.importCollection.buildImportStatements();
        let componentText = `/* eslint-disable */${os_1.EOL}`;
        for (const importStatement of imports) {
            const result = printer.printNode(typescript_1.EmitHint.Unspecified, importStatement, file);
            componentText += result + os_1.EOL;
        }
        componentText += os_1.EOL;
        const propsPrinted = printer.printNode(typescript_1.EmitHint.Unspecified, propsDeclaration, file);
        componentText += propsPrinted;
        componentText += os_1.EOL;
        const result = printer.printNode(typescript_1.EmitHint.Unspecified, wrappedFunction, file);
        componentText += result;
        const { componentText: transpiledComponentText, declaration } = (0, react_frontend_manager_template_renderer_helper_1.transpile)(componentText, this.renderConfig);
        return {
            componentText: transpiledComponentText,
            declaration,
            renderComponentToFilesystem: async (outputPath) => {
                await this.renderComponentToFilesystem(transpiledComponentText)(this.fileName)(outputPath);
                if (declaration) {
                    await this.renderComponentToFilesystem(declaration)((0, react_frontend_manager_template_renderer_helper_1.getDeclarationFilename)(this.fileName))(outputPath);
                }
            },
        };
    }
    renderFunctionWrapper(componentName, jsx, renderExport) {
        const componentPropType = (0, react_component_render_helper_1.getComponentPropName)(componentName);
        const codeBlockContent = this.buildVariableStatements(this.component);
        const jsxStatement = typescript_1.factory.createParenthesizedExpression(this.renderConfig.script !== react_render_config_1.ScriptKind.TSX
            ? jsx
            : /* add ts-ignore comment above jsx statement. Generated props are incompatible with amplify-ui props */
                (0, typescript_1.addSyntheticLeadingComment)(typescript_1.factory.createParenthesizedExpression(jsx), typescript_1.SyntaxKind.MultiLineCommentTrivia, ' @ts-ignore: TS2322 ', true));
        codeBlockContent.push(typescript_1.factory.createReturnStatement(jsxStatement));
        const modifiers = renderExport
            ? [typescript_1.factory.createModifier(typescript_1.SyntaxKind.ExportKeyword), typescript_1.factory.createModifier(typescript_1.SyntaxKind.DefaultKeyword)]
            : [];
        const typeParameter = primitive_1.PrimitiveTypeParameter[primitive_1.default[this.component.componentType]];
        // only use type parameter reference if one was declared
        const typeParameterReference = typeParameter && typeParameter.declaration() ? typeParameter.reference() : undefined;
        return typescript_1.factory.createFunctionDeclaration(undefined, modifiers, undefined, typescript_1.factory.createIdentifier(componentName), typeParameter ? typeParameter.declaration() : undefined, [
            typescript_1.factory.createParameterDeclaration(undefined, undefined, undefined, 'props', undefined, typescript_1.factory.createTypeReferenceNode(componentPropType, typeParameterReference), undefined),
        ], typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createQualifiedName(typescript_1.factory.createIdentifier('React'), typescript_1.factory.createIdentifier('ReactElement')), undefined), typescript_1.factory.createBlock(codeBlockContent, true));
    }
    renderAppWrapper(appName, jsx) {
        const declarationList = typescript_1.factory.createVariableDeclarationList([
            typescript_1.factory.createVariableDeclaration(appName, undefined, undefined, typescript_1.factory.createArrowFunction(undefined, undefined, [], undefined, typescript_1.factory.createToken(typescript_1.default.SyntaxKind.EqualsGreaterThanToken), typescript_1.factory.createBlock([typescript_1.factory.createReturnStatement(typescript_1.factory.createParenthesizedExpression(jsx))], true))),
        ], typescript_1.default.NodeFlags.Const);
        const wrapper = typescript_1.factory.createVariableStatement([typescript_1.factory.createModifier(typescript_1.SyntaxKind.ExportKeyword)], declarationList);
        return wrapper;
    }
    renderSampleCodeSnippetJsx(component) {
        return new sampleCodeRenderer_1.default(component, this.importCollection).renderElement();
    }
    renderBindingPropsType(component) {
        const escapeHatchTypeNode = typescript_1.factory.createTypeLiteralNode([
            typescript_1.factory.createPropertySignature(undefined, typescript_1.factory.createIdentifier('overrides'), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.QuestionToken), typescript_1.factory.createUnionTypeNode([
                typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier('EscapeHatchProps'), undefined),
                typescript_1.factory.createKeywordTypeNode(typescript_1.default.SyntaxKind.UndefinedKeyword),
                typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createNull()),
            ])),
        ]);
        const componentPropType = (0, react_component_render_helper_1.getComponentPropName)(component.name);
        const propsTypeParameter = primitive_1.PrimitiveTypeParameter[primitive_1.default[component.componentType]];
        this.importCollection.addImport('@aws-amplify/ui-react', 'EscapeHatchProps');
        return typescript_1.factory.createTypeAliasDeclaration(undefined, [typescript_1.factory.createModifier(typescript_1.default.SyntaxKind.ExportKeyword)], typescript_1.factory.createIdentifier(componentPropType), propsTypeParameter ? propsTypeParameter.declaration() : undefined, typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier('React.PropsWithChildren'), [
            typescript_1.factory.createIntersectionTypeNode(this.dropMissingListElements([
                this.buildBasePropNode(component),
                this.buildComponentPropNode(component),
                this.buildVariantPropNode(component),
                escapeHatchTypeNode,
            ])),
        ]));
    }
    buildBasePropNode(component) {
        const propsType = this.getPropsTypeName(component);
        const componentIsPrimitive = (0, primitive_1.isPrimitive)(component.componentType);
        if (componentIsPrimitive || (0, primitive_1.isBuiltInIcon)(component.componentType)) {
            this.importCollection.addImport('@aws-amplify/ui-react', propsType);
        }
        else {
            this.importCollection.addImport(`./${component.componentType}`, `${component.componentType}Props`);
        }
        const propsTypeParameter = componentIsPrimitive
            ? primitive_1.PrimitiveTypeParameter[primitive_1.default[component.componentType]]
            : undefined;
        const basePropType = typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier(propsType), propsTypeParameter ? propsTypeParameter.reference() : undefined);
        return typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier('Partial'), [basePropType]);
    }
    /**
     * This builder is responsible primarily for identifying the variant options, partioning them into
     * required and optional parameters, then building the appropriate property signature based on that.
     * e.g.
       {
         variant?: "primary" | "secondary",
         size?: "large",
       }
     */
    buildVariantPropNode(component) {
        if (!(0, codegen_ui_1.isFrontendManagerComponentWithVariants)(component)) {
            return undefined;
        }
        const variantValues = component.variants.map((variant) => variant.variantValues);
        const allKeys = [...new Set(variantValues.flatMap((variantValue) => Object.keys(variantValue)))];
        const requiredKeys = allKeys
            .filter((key) => variantValues.every((variantValue) => Object.keys(variantValue).includes(key)))
            .sort();
        const optionalKeys = [...allKeys].filter((key) => !requiredKeys.includes(key)).sort();
        const requiredProperties = requiredKeys.map((key) => {
            const variantOptions = [
                ...new Set(variantValues
                    .map((variantValue) => variantValue[key])
                    .filter((variantOption) => variantOption !== undefined && variantOption !== null)),
            ].sort();
            const valueTypeNodes = variantOptions.map((variantOption) => typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createStringLiteral(variantOption)));
            return typescript_1.factory.createPropertySignature(undefined, typescript_1.factory.createIdentifier(key), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.QuestionToken), typescript_1.factory.createUnionTypeNode(valueTypeNodes));
        });
        const optionalProperties = optionalKeys.map((key) => {
            const variantOptions = [
                ...new Set(variantValues
                    .map((variantValue) => variantValue[key])
                    .filter((variantOption) => variantOption !== undefined && variantOption !== null)),
            ].sort();
            const valueTypeNodes = variantOptions.map((variantOption) => typescript_1.factory.createLiteralTypeNode(typescript_1.factory.createStringLiteral(variantOption)));
            return typescript_1.factory.createPropertySignature(undefined, typescript_1.factory.createIdentifier(key), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.QuestionToken), typescript_1.factory.createUnionTypeNode(valueTypeNodes));
        });
        return typescript_1.factory.createTypeLiteralNode([...requiredProperties, ...optionalProperties]);
    }
    buildComponentPropNode(component) {
        const propSignatures = [];
        const bindingProps = component.bindingProperties;
        if (bindingProps === undefined || !(0, codegen_ui_1.isFrontendManagerComponentWithBinding)(component)) {
            return undefined;
        }
        for (const bindingProp of Object.entries(component.bindingProperties)) {
            const [propName, binding] = bindingProp;
            if ((0, codegen_ui_1.isSimplePropertyBinding)(binding)) {
                const propSignature = typescript_1.factory.createPropertySignature(undefined, propName, typescript_1.factory.createToken(typescript_1.SyntaxKind.QuestionToken), typescript_1.factory.createTypeReferenceNode(binding.type, undefined));
                propSignatures.push(propSignature);
            }
            else if ((0, codegen_ui_1.isDataPropertyBinding)(binding)) {
                const propSignature = typescript_1.factory.createPropertySignature(undefined, propName, typescript_1.factory.createToken(typescript_1.SyntaxKind.QuestionToken), typescript_1.factory.createTypeReferenceNode(binding.bindingProperties.model, undefined));
                propSignatures.push(propSignature);
            }
        }
        if (component.componentType === 'Collection') {
            const propSignature = typescript_1.factory.createPropertySignature(undefined, 'items', typescript_1.factory.createToken(typescript_1.SyntaxKind.QuestionToken), typescript_1.factory.createTypeReferenceNode('any[]', undefined));
            propSignatures.push(propSignature);
        }
        if (propSignatures.length === 0) {
            return undefined;
        }
        return typescript_1.factory.createTypeLiteralNode(propSignatures);
    }
    buildVariableStatements(component) {
        const statements = [];
        const elements = [];
        if ((0, codegen_ui_1.isFrontendManagerComponentWithBinding)(component)) {
            Object.entries(component.bindingProperties).forEach((entry) => {
                const [propName, binding] = entry;
                if ((0, codegen_ui_1.isSimplePropertyBinding)(binding) || (0, codegen_ui_1.isDataPropertyBinding)(binding)) {
                    const usesHook = (0, react_frontend_manager_template_renderer_helper_1.bindingPropertyUsesHook)(binding);
                    const bindingElement = typescript_1.factory.createBindingElement(undefined, usesHook ? typescript_1.factory.createIdentifier(propName) : undefined, typescript_1.factory.createIdentifier(usesHook ? `${propName}Prop` : propName), (0, codegen_ui_1.isSimplePropertyBinding)(binding) ? this.getDefaultValue(binding) : undefined);
                    elements.push(bindingElement);
                }
            });
        }
        if (component.componentType === 'Collection') {
            const bindingElement = this.hasCollectionPropertyNamedItems(component)
                ? typescript_1.factory.createBindingElement(undefined, typescript_1.factory.createIdentifier('items'), typescript_1.factory.createIdentifier('itemsProp'), undefined)
                : typescript_1.factory.createBindingElement(undefined, undefined, typescript_1.factory.createIdentifier('items'), undefined);
            elements.push(bindingElement);
        }
        // remove overrides from rest of props
        elements.push(typescript_1.factory.createBindingElement(undefined, typescript_1.factory.createIdentifier('overrides'), typescript_1.factory.createIdentifier('overridesProp'), undefined));
        // get rest of props to pass to top level component
        elements.push(typescript_1.factory.createBindingElement(typescript_1.factory.createToken(typescript_1.default.SyntaxKind.DotDotDotToken), undefined, typescript_1.factory.createIdentifier('rest'), undefined));
        const statement = typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
            typescript_1.factory.createVariableDeclaration(typescript_1.factory.createObjectBindingPattern(elements), undefined, undefined, typescript_1.factory.createIdentifier('props')),
        ], typescript_1.default.NodeFlags.Const));
        statements.push(statement);
        if ((0, codegen_ui_1.isFrontendManagerComponentWithVariants)(component)) {
            statements.push(this.buildVariantDeclaration(component.variants));
            // TODO: In components, replace props.override with override (defined here).
        }
        if ((0, codegen_ui_1.isFrontendManagerComponentWithVariants)(component)) {
            statements.push(this.buildMergeOverridesFunction());
        }
        statements.push(this.buildOverridesDeclaration((0, codegen_ui_1.isFrontendManagerComponentWithVariants)(component)));
        const authStatement = this.buildUseAuthenticatedUserStatement(component);
        if (authStatement !== undefined) {
            this.importCollection.addImport('@aws-amplify/ui-react/internal', 'useAuth');
            statements.push(authStatement);
        }
        const collectionBindingStatements = this.buildCollectionBindingStatements(component);
        collectionBindingStatements.forEach((entry) => {
            statements.push(entry);
        });
        const useStoreBindingStatements = this.buildUseDataStoreBindingStatements(component);
        useStoreBindingStatements.forEach((entry) => {
            statements.push(entry);
        });
        const actionStatement = this.buildUseActionsStatement(component);
        if (actionStatement !== undefined) {
            statements.push(actionStatement);
        }
        return statements;
    }
    buildUseAuthenticatedUserStatement(component) {
        if ((0, codegen_ui_1.isFrontendManagerComponentWithBinding)(component)) {
            const authPropertyBindings = Object.entries(component.bindingProperties).filter(([, binding]) => (0, codegen_ui_1.isAuthPropertyBinding)(binding));
            if (authPropertyBindings.length) {
                // create destructuring statements
                // { propertyName: newName, ['custom:property']: customProperty }
                const bindings = typescript_1.factory.createObjectBindingPattern(authPropertyBindings.map(([propName, binding]) => {
                    const { bindingProperties: { userAttribute }, } = binding;
                    let propertyName = typescript_1.factory.createIdentifier(userAttribute);
                    if (userAttribute.startsWith('custom:')) {
                        propertyName = typescript_1.factory.createComputedPropertyName(typescript_1.factory.createStringLiteral(userAttribute));
                    }
                    else if (propName === userAttribute) {
                        propertyName = undefined;
                    }
                    return typescript_1.factory.createBindingElement(undefined, propertyName, typescript_1.factory.createIdentifier(propName), undefined);
                }));
                // get values from useAuthenticatedUser
                // const { property } = useAuth().user?.attributes || {};
                return typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
                    typescript_1.factory.createVariableDeclaration(bindings, undefined, undefined, typescript_1.factory.createBinaryExpression(typescript_1.factory.createPropertyAccessChain(typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier('useAuth'), undefined, []), typescript_1.factory.createIdentifier('user')), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.QuestionDotToken), typescript_1.factory.createIdentifier('attributes')), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.QuestionQuestionToken), typescript_1.factory.createObjectLiteralExpression([], false))),
                ], typescript_1.default.NodeFlags.Const));
            }
        }
        return undefined;
    }
    /**
     * const variants = [
       {
         variantValues: { variant: 'primary' },
         overrides: { Button: { fontSize: '12px' } },
       },
       {
         variantValues: { variant: 'secondary' },
         overrides: { Button: { fontSize: '40px' } }
       }
     ];
     */
    buildVariantDeclaration(variants) {
        return typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
            typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier('variants'), undefined, typescript_1.factory.createArrayTypeNode(typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier('Variant'), undefined)), (0, react_frontend_manager_template_renderer_helper_1.jsonToLiteral)(variants)),
        ], typescript_1.default.NodeFlags.Const));
    }
    buildMergeOverridesFunction() {
        return typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
            typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier('mergeVariantsAndOverrides'), undefined, undefined, typescript_1.factory.createArrowFunction(undefined, undefined, [
                typescript_1.factory.createParameterDeclaration(undefined, undefined, undefined, typescript_1.factory.createIdentifier('variants'), undefined, typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier('EscapeHatchProps'), undefined), undefined),
                typescript_1.factory.createParameterDeclaration(undefined, undefined, undefined, typescript_1.factory.createIdentifier('overrides'), undefined, typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier('EscapeHatchProps'), undefined), undefined),
            ], typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier('EscapeHatchProps'), undefined), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.EqualsGreaterThanToken), typescript_1.factory.createBlock([
                typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
                    typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier('overrideKeys'), undefined, undefined, typescript_1.factory.createNewExpression(typescript_1.factory.createIdentifier('Set'), undefined, [
                        typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier('Object'), typescript_1.factory.createIdentifier('keys')), undefined, [typescript_1.factory.createIdentifier('overrides')]),
                    ])),
                ], typescript_1.default.NodeFlags.Const)),
                typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
                    typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier('sharedKeys'), undefined, undefined, typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier('Object'), typescript_1.factory.createIdentifier('keys')), undefined, [typescript_1.factory.createIdentifier('variants')]), typescript_1.factory.createIdentifier('filter')), undefined, [
                        typescript_1.factory.createArrowFunction(undefined, undefined, [
                            typescript_1.factory.createParameterDeclaration(undefined, undefined, undefined, typescript_1.factory.createIdentifier('variantKey'), undefined, undefined, undefined),
                        ], undefined, typescript_1.factory.createToken(typescript_1.default.SyntaxKind.EqualsGreaterThanToken), typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier('overrideKeys'), typescript_1.factory.createIdentifier('has')), undefined, [typescript_1.factory.createIdentifier('variantKey')])),
                    ])),
                ], typescript_1.default.NodeFlags.Const)),
                typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
                    typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier('merged'), undefined, undefined, typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier('Object'), typescript_1.factory.createIdentifier('fromEntries')), undefined, [
                        typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier('sharedKeys'), typescript_1.factory.createIdentifier('map')), undefined, [
                            typescript_1.factory.createArrowFunction(undefined, undefined, [
                                typescript_1.factory.createParameterDeclaration(undefined, undefined, undefined, typescript_1.factory.createIdentifier('sharedKey'), undefined, undefined, undefined),
                            ], undefined, typescript_1.factory.createToken(typescript_1.default.SyntaxKind.EqualsGreaterThanToken), typescript_1.factory.createArrayLiteralExpression([
                                typescript_1.factory.createIdentifier('sharedKey'),
                                typescript_1.factory.createObjectLiteralExpression([
                                    typescript_1.factory.createSpreadAssignment(typescript_1.factory.createElementAccessExpression(typescript_1.factory.createIdentifier('variants'), typescript_1.factory.createIdentifier('sharedKey'))),
                                    typescript_1.factory.createSpreadAssignment(typescript_1.factory.createElementAccessExpression(typescript_1.factory.createIdentifier('overrides'), typescript_1.factory.createIdentifier('sharedKey'))),
                                ], false),
                            ], false)),
                        ]),
                    ])),
                ], typescript_1.default.NodeFlags.Const)),
                typescript_1.factory.createReturnStatement(typescript_1.factory.createObjectLiteralExpression([
                    typescript_1.factory.createSpreadAssignment(typescript_1.factory.createIdentifier('variants')),
                    typescript_1.factory.createSpreadAssignment(typescript_1.factory.createIdentifier('overrides')),
                    typescript_1.factory.createSpreadAssignment(typescript_1.factory.createIdentifier('merged')),
                ], true)),
            ], true))),
        ], typescript_1.default.NodeFlags.Const));
    }
    /**
     * case: hasVariants = true => const overrides = { ...getOverridesFromVariants(variants, props) };
     * case: hasVariants = false => const overrides = { ...overridesProp };
     */
    buildOverridesDeclaration(hasVariants) {
        if (hasVariants) {
            this.importCollection.addImport('@aws-amplify/ui-react/internal', 'getOverridesFromVariants');
            this.importCollection.addImport('@aws-amplify/ui-react/internal', 'Variant');
            return typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
                typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier('overrides'), undefined, undefined, typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier('mergeVariantsAndOverrides'), undefined, [
                    typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier('getOverridesFromVariants'), undefined, [
                        typescript_1.factory.createIdentifier('variants'),
                        typescript_1.factory.createIdentifier('props'),
                    ]),
                    typescript_1.factory.createBinaryExpression(typescript_1.factory.createIdentifier('overridesProp'), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.BarBarToken), typescript_1.factory.createObjectLiteralExpression([], false)),
                ])),
            ], typescript_1.default.NodeFlags.Const));
        }
        return typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
            typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier('overrides'), undefined, undefined, typescript_1.factory.createObjectLiteralExpression([
                typescript_1.factory.createSpreadAssignment(typescript_1.factory.createIdentifier('overridesProp')),
            ])),
        ], typescript_1.default.NodeFlags.Const));
    }
    buildCollectionBindingStatements(component) {
        const statements = [];
        if ((0, codegen_ui_1.isFrontendManagerComponentWithCollectionProperties)(component)) {
            Object.entries(component.collectionProperties).forEach((collectionProp) => {
                const [propName, { model, sort, predicate }] = collectionProp;
                if (predicate) {
                    statements.push(this.buildPredicateDeclaration(propName, predicate));
                    statements.push(this.buildCreateDataStorePredicateCall(model, propName));
                }
                if (sort) {
                    this.importCollection.addImport('@aws-amplify/datastore', 'SortDirection');
                    this.importCollection.addImport('@aws-amplify/datastore', 'SortPredicate');
                    statements.push(this.buildPaginationStatement(propName, model, sort));
                }
                this.importCollection.addImport('../models', model);
                statements.push(this.buildPropPrecedentStatement(propName, this.hasCollectionPropertyNamedItems(component) ? 'itemsProp' : 'items', typescript_1.factory.createPropertyAccessExpression(this.buildUseDataStoreBindingCall('collection', model, predicate ? this.getFilterName(propName) : undefined, sort ? this.getPaginationName(propName) : undefined), 'items')));
            });
        }
        return statements;
    }
    buildCreateDataStorePredicateCall(type, name) {
        this.importCollection.addImport('@aws-amplify/ui-react/internal', 'createDataStorePredicate');
        return typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
            typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier(this.getFilterName(name)), undefined, undefined, typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier('createDataStorePredicate'), [typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier(type), undefined)], [typescript_1.factory.createIdentifier(this.getFilterObjName(name))])),
        ], typescript_1.default.NodeFlags.Const));
    }
    buildUseDataStoreBindingStatements(component) {
        const statements = [];
        // generate for single record binding
        if (component.bindingProperties !== undefined) {
            Object.entries(component.bindingProperties).forEach((compBindingProp) => {
                const [propName, binding] = compBindingProp;
                if ((0, codegen_ui_1.isDataPropertyBinding)(binding)) {
                    const { bindingProperties } = binding;
                    if ('predicate' in bindingProperties && bindingProperties.predicate !== undefined) {
                        this.importCollection.addImport('@aws-amplify/ui-react/internal', 'useDataStoreBinding');
                        /* const buttonColorFilter = {
                         *   field: "userID",
                         *   operand: "user@email.com",
                         *   operator: "eq",
                         * }
                         */
                        statements.push(this.buildPredicateDeclaration(propName, bindingProperties.predicate));
                        statements.push(this.buildCreateDataStorePredicateCall(bindingProperties.model, propName));
                        const { model } = bindingProperties;
                        this.importCollection.addImport('../models', model);
                        /* const buttonColorDataStore = useDataStoreBinding({
                         *   type: "collection"
                         *   ...
                         * }).items[0];
                         */
                        statements.push(typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
                            typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier(this.getDataStoreName(propName)), undefined, undefined, typescript_1.factory.createElementAccessExpression(typescript_1.factory.createPropertyAccessExpression(this.buildUseDataStoreBindingCall('collection', model, this.getFilterName(propName)), typescript_1.factory.createIdentifier('items')), typescript_1.factory.createNumericLiteral('0'))),
                        ], typescript_1.default.NodeFlags.Const)));
                        statements.push(typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
                            typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier(propName), undefined, undefined, typescript_1.factory.createConditionalExpression(typescript_1.factory.createBinaryExpression(typescript_1.factory.createIdentifier(`${propName}Prop`), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.ExclamationEqualsEqualsToken), typescript_1.factory.createIdentifier('undefined')), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.QuestionToken), typescript_1.factory.createIdentifier(`${propName}Prop`), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.ColonToken), typescript_1.factory.createIdentifier(this.getDataStoreName(propName)))),
                        ], typescript_1.default.NodeFlags.Const)));
                    }
                }
            });
        }
        return statements;
    }
    buildPropPrecedentStatement(precedentName, propName, defaultExpression) {
        return typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
            typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier(precedentName), undefined, undefined, typescript_1.factory.createConditionalExpression(typescript_1.factory.createBinaryExpression(typescript_1.factory.createIdentifier(propName), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.ExclamationEqualsEqualsToken), typescript_1.factory.createIdentifier('undefined')), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.QuestionToken), typescript_1.factory.createIdentifier(propName), typescript_1.factory.createToken(typescript_1.default.SyntaxKind.ColonToken), defaultExpression)),
        ], typescript_1.default.NodeFlags.Const));
    }
    /**
     * const buttonUserSort = {
     *   sort: (s: SortPredicate<User>) => s.firstName('DESCENDING').lastName('ASCENDING')
     * }
     */
    buildPaginationStatement(propName, model, sort) {
        return typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
            typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier(this.getPaginationName(propName)), undefined, undefined, typescript_1.factory.createObjectLiteralExpression([].concat(sort
                ? [
                    typescript_1.factory.createPropertyAssignment(typescript_1.factory.createIdentifier('sort'), this.buildSortFunction(model, sort)),
                ]
                : []))),
        ], typescript_1.default.NodeFlags.Const));
    }
    /**
     * (s: SortPredicate<User>) => s.firstName('ASCENDING').lastName('DESCENDING')
     */
    buildSortFunction(model, sort) {
        const ascendingSortDirection = typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier('SortDirection'), typescript_1.factory.createIdentifier('ASCENDING'));
        const descendingSortDirection = typescript_1.factory.createPropertyAccessExpression(typescript_1.factory.createIdentifier('SortDirection'), typescript_1.factory.createIdentifier('DESCENDING'));
        let expr = typescript_1.factory.createIdentifier('s');
        sort.forEach((sortPredicate) => {
            expr = typescript_1.factory.createCallExpression(typescript_1.factory.createPropertyAccessExpression(expr, typescript_1.factory.createIdentifier(sortPredicate.field)), undefined, [sortPredicate.direction === 'ASC' ? ascendingSortDirection : descendingSortDirection]);
        });
        return typescript_1.factory.createArrowFunction(undefined, undefined, [
            typescript_1.factory.createParameterDeclaration(undefined, undefined, undefined, typescript_1.factory.createIdentifier('s'), undefined, typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier('SortPredicate'), [
                typescript_1.factory.createTypeReferenceNode(typescript_1.factory.createIdentifier(model), undefined),
            ]), undefined),
        ], undefined, typescript_1.factory.createToken(typescript_1.default.SyntaxKind.EqualsGreaterThanToken), expr);
    }
    /* Build useActions hook with component.actions passed
     *
     * Example:
     * const { invokeAction } = useActions({
     *   signOutAction: {
     *     type: "Amplify.Auth.SignOut",
     *     parameters: { global: true },
     *   },
     * });
     */
    buildUseActionsStatement(component) {
        if ((0, codegen_ui_1.isFrontendManagerComponentWithActions)(component)) {
            return typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
                typescript_1.factory.createVariableDeclaration(typescript_1.factory.createObjectBindingPattern([
                    typescript_1.factory.createBindingElement(undefined, undefined, typescript_1.factory.createIdentifier('invokeAction'), undefined),
                ]), undefined, undefined, typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier('useActions'), undefined, [
                    this.actionsToObjectLiteralExpression(component.actions),
                ])),
            ], typescript_1.default.NodeFlags.Const));
        }
        return undefined;
    }
    buildUseDataStoreBindingCall(callType, bindingModel, criteriaName, paginationName) {
        this.importCollection.addImport('@aws-amplify/ui-react/internal', 'useDataStoreBinding');
        const objectProperties = [
            typescript_1.factory.createPropertyAssignment(typescript_1.factory.createIdentifier('type'), typescript_1.factory.createStringLiteral(callType)),
            typescript_1.factory.createPropertyAssignment(typescript_1.factory.createIdentifier('model'), typescript_1.factory.createIdentifier(bindingModel)),
        ]
            .concat(criteriaName
            ? [
                typescript_1.factory.createPropertyAssignment(typescript_1.factory.createIdentifier('criteria'), typescript_1.factory.createIdentifier(criteriaName)),
            ]
            : [])
            .concat(paginationName
            ? [
                typescript_1.factory.createPropertyAssignment(typescript_1.factory.createIdentifier('pagination'), typescript_1.factory.createIdentifier(paginationName)),
            ]
            : []);
        return typescript_1.factory.createCallExpression(typescript_1.factory.createIdentifier('useDataStoreBinding'), undefined, [
            typescript_1.factory.createObjectLiteralExpression(objectProperties, true),
        ]);
    }
    predicateToObjectLiteralExpression(predicate) {
        return typescript_1.factory.createObjectLiteralExpression(Object.entries(predicate).map(([key, value]) => {
            return typescript_1.factory.createPropertyAssignment(typescript_1.factory.createIdentifier(key), key === 'and' || key === 'or'
                ? typescript_1.factory.createArrayLiteralExpression(value.map((pred) => this.predicateToObjectLiteralExpression(pred), false))
                : typescript_1.factory.createStringLiteral(value));
        }, false));
    }
    actionsToObjectLiteralExpression(actions) {
        // TODO: support property bindings
        return (0, react_frontend_manager_template_renderer_helper_1.jsonToLiteral)(actions);
    }
    buildPredicateDeclaration(name, predicate) {
        return typescript_1.factory.createVariableStatement(undefined, typescript_1.factory.createVariableDeclarationList([
            typescript_1.factory.createVariableDeclaration(typescript_1.factory.createIdentifier(this.getFilterObjName(name)), undefined, undefined, this.predicateToObjectLiteralExpression(predicate)),
        ], typescript_1.default.NodeFlags.Const));
    }
    hasCollectionPropertyNamedItems(component) {
        if (component.collectionProperties === undefined) {
            return false;
        }
        return Object.keys(component.collectionProperties).some((propName) => propName === 'items');
    }
    getPaginationName(propName) {
        return `${propName}Pagination`;
    }
    getFilterObjName(propName) {
        return `${propName}FilterObj`;
    }
    getFilterName(propName) {
        return `${propName}Filter`;
    }
    getDataStoreName(propName) {
        return `${propName}DataStore`;
    }
    getPropsTypeName(component) {
        if ((0, primitive_1.isBuiltInIcon)(component.componentType)) {
            return 'IconProps';
        }
        return `${component.componentType}Props`;
    }
    dropMissingListElements(elements) {
        return elements.filter((element) => element !== null && element !== undefined);
    }
    getDefaultValue(binding) {
        if (binding.defaultValue !== undefined) {
            switch (binding.type) {
                case 'String':
                    return typescript_1.factory.createStringLiteral(binding.defaultValue);
                case 'Number':
                    return typescript_1.factory.createNumericLiteral(binding.defaultValue);
                case 'Boolean':
                    return JSON.parse(binding.defaultValue) ? typescript_1.factory.createTrue() : typescript_1.factory.createFalse();
                default:
                    throw new Error(`Could not parse binding with type ${binding.type}`);
            }
        }
        return undefined;
    }
}
__decorate([
    codegen_ui_1.handleCodegenErrors
], ReactFrontendManagerTemplateRenderer.prototype, "renderSampleCodeSnippet", null);
__decorate([
    codegen_ui_1.handleCodegenErrors
], ReactFrontendManagerTemplateRenderer.prototype, "renderComponentOnly", null);
exports.ReactFrontendManagerTemplateRenderer = ReactFrontendManagerTemplateRenderer;
//# sourceMappingURL=react-frontend-manager-template-renderer.js.map