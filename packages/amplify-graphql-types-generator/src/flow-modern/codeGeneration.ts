import * as t from '@babel/types';
import { stripIndent } from 'common-tags';
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLNonNull,
} from 'graphql';
import * as path from 'path';

import {
  CompilerContext,
  Operation,
  Fragment,
  SelectionSet,
  Field,
} from '../compiler';

import {
  typeCaseForSelectionSet,
  Variant
} from '../compiler/visitors/typeCase';

import {
  collectAndMergeFields
} from '../compiler/visitors/collectAndMergeFields';

import { BasicGeneratedFile } from '../utilities/CodeGenerator';
import FlowGenerator, { ObjectProperty, FlowCompilerOptions, } from './language';
import Printer from './printer';

class FlowGeneratedFile implements BasicGeneratedFile {
  fileContents: string;

  constructor(fileContents: string) {
    this.fileContents = fileContents;
  }
  get output() {
    return this.fileContents
  }
}

function printEnumsAndInputObjects(generator: FlowAPIGenerator, context: CompilerContext) {
  generator.printer.enqueue(stripIndent`
    //==============================================================
    // START Enums and Input Objects
    // All enums and input objects are included in every output file
    // for now, but this will be changed soon.
    // TODO: Link to issue to fix this.
    //==============================================================
  `);

  context.typesUsed
    .filter(type => (type instanceof GraphQLEnumType))
    .forEach((enumType) => {
      generator.typeAliasForEnumType(enumType as GraphQLEnumType);
    });

  context.typesUsed
    .filter(type => type instanceof GraphQLInputObjectType)
    .forEach((inputObjectType) => {
      generator.typeAliasForInputObjectType(inputObjectType as GraphQLInputObjectType);
    });

  generator.printer.enqueue(stripIndent`
    //==============================================================
    // END Enums and Input Objects
    //==============================================================
  `)
}

export function generateSource(
  context: CompilerContext,
) {
  const generator = new FlowAPIGenerator(context);
  const generatedFiles: { [filePath: string]: FlowGeneratedFile } = {};

  Object.values(context.operations)
    .forEach((operation) => {
      generator.fileHeader();
      generator.typeAliasesForOperation(operation);
      printEnumsAndInputObjects(generator, context);

      const output = generator.printer.printAndClear();

      const outputFilePath = path.join(
        path.dirname(operation.filePath),
        '__generated__',
        `${operation.operationName}.js`
      );

      generatedFiles[outputFilePath] = new FlowGeneratedFile(output);
    });

  Object.values(context.fragments)
    .forEach((fragment) => {
      generator.fileHeader();
      generator.typeAliasesForFragment(fragment);
      printEnumsAndInputObjects(generator, context);

      const output = generator.printer.printAndClear();

      const outputFilePath = path.join(
        path.dirname(fragment.filePath),
        '__generated__',
        `${fragment.fragmentName}.js`
      );

      generatedFiles[outputFilePath] = new FlowGeneratedFile(output);
    });

  return generatedFiles;
}

export class FlowAPIGenerator extends FlowGenerator {
  context: CompilerContext
  printer: Printer
  scopeStack: string[]

  constructor(context: CompilerContext) {
    super(context.options as FlowCompilerOptions);

    this.context = context;
    this.printer = new Printer();
    this.scopeStack = [];
  }

  fileHeader() {
    this.printer.enqueue(
      stripIndent`
        /* @flow */
        // This file was automatically generated and should not be edited.
      `
    );
  }

  public typeAliasForEnumType(enumType: GraphQLEnumType) {
    this.printer.enqueue(this.enumerationDeclaration(enumType));
  }

  public typeAliasForInputObjectType(inputObjectType: GraphQLInputObjectType) {
    this.printer.enqueue(this.inputObjectDeclaration(inputObjectType));
  }

  public typeAliasesForOperation(operation: Operation) {
    const {
      operationType,
      operationName,
      selectionSet
    } = operation;

    this.scopeStackPush(operationName);

    this.printer.enqueue(stripIndent`
      // ====================================================
      // GraphQL ${operationType} operation: ${operationName}
      // ====================================================
    `)

    // The root operation only has one variant
    // Do we need to get exhaustive variants anyway?
    const variants = this.getVariantsForSelectionSet(selectionSet);

    const variant = variants[0];
    const properties = this.getPropertiesForVariant(variant);

    const exportedTypeAlias = this.exportDeclaration(
      this.typeAliasObject(operationName, properties)
    );

    this.printer.enqueue(exportedTypeAlias);
    this.scopeStackPop();
  }

  public typeAliasesForFragment(fragment: Fragment) {
    const {
      fragmentName,
      selectionSet
    } = fragment;

    this.scopeStackPush(fragmentName);

    this.printer.enqueue(stripIndent`
      // ====================================================
      // GraphQL fragment: ${fragmentName}
      // ====================================================
    `);

    const variants = this.getVariantsForSelectionSet(selectionSet);

    if (variants.length === 1) {
      const properties = this.getPropertiesForVariant(variants[0]);

      const name = this.annotationFromScopeStack(this.scopeStack).id.name;
      const exportedTypeAlias = this.exportDeclaration(
        this.typeAliasObject(
          name,
          properties
        )
      );

      this.printer.enqueue(exportedTypeAlias);
    } else {
      const unionMembers: t.FlowTypeAnnotation[] = [];
      variants.forEach(variant => {
        this.scopeStackPush(variant.possibleTypes[0].toString());
        const properties = this.getPropertiesForVariant(variant);

        const name = this.annotationFromScopeStack(this.scopeStack).id.name;
        const exportedTypeAlias = this.exportDeclaration(
          this.typeAliasObject(
            name,
            properties
          )
        );

        this.printer.enqueue(exportedTypeAlias);

        unionMembers.push(this.annotationFromScopeStack(this.scopeStack));

        this.scopeStackPop();
      });

      this.printer.enqueue(
        this.exportDeclaration(
          this.typeAliasGenericUnion(
            this.annotationFromScopeStack(this.scopeStack).id.name,
            unionMembers
          )
        )
      );
    }

    this.scopeStackPop();
  }

  private getVariantsForSelectionSet(selectionSet: SelectionSet) {
    return this.getTypeCasesForSelectionSet(selectionSet).exhaustiveVariants;
  }

  private getTypeCasesForSelectionSet(selectionSet: SelectionSet) {
    return typeCaseForSelectionSet(
      selectionSet,
      this.context.options.mergeInFieldsFromFragmentSpreads
    );
  }

  private getPropertiesForVariant(variant: Variant): ObjectProperty[] {
    const fields = collectAndMergeFields(
      variant,
      this.context.options.mergeInFieldsFromFragmentSpreads
    );

    return fields.map(field => {
      const fieldName = field.alias !== undefined ? field.alias : field.name;
      this.scopeStackPush(fieldName);

      let res;
      if (field.selectionSet) {
        const genericAnnotation = this.annotationFromScopeStack(this.scopeStack);
        if (field.type instanceof GraphQLNonNull) {
          genericAnnotation.id.name = genericAnnotation.id.name;
        } else {
          genericAnnotation.id.name = '?' + genericAnnotation.id.name;
        }

        res = this.handleFieldSelectionSetValue(
          genericAnnotation,
          field
        );
      } else {
        res = this.handleFieldValue(
          field,
          variant
        );
      }

      this.scopeStackPop();
      return res;
    });
  }

  private handleFieldSelectionSetValue(genericAnnotation: t.GenericTypeAnnotation, field: Field) {
    const { selectionSet } = field;

    const typeCase = this.getTypeCasesForSelectionSet(selectionSet as SelectionSet);
    const variants = typeCase.exhaustiveVariants;

    let exportedTypeAlias;
    if (variants.length === 1) {
      const variant = variants[0];
      const properties = this.getPropertiesForVariant(variant);
      exportedTypeAlias = this.exportDeclaration(
        this.typeAliasObject(
          this.annotationFromScopeStack(this.scopeStack).id.name,
          properties
        )
      );
    } else {
      const propertySets = variants.map(variant => {
        this.scopeStackPush(variant.possibleTypes[0].toString())
        const properties = this.getPropertiesForVariant(variant);
        this.scopeStackPop();
        return properties;
      })

      exportedTypeAlias = this.exportDeclaration(
        this.typeAliasObjectUnion(
          genericAnnotation.id.name,
          propertySets
        )
      );
    }

    this.printer.enqueue(exportedTypeAlias);

    return {
      name: field.alias ? field.alias : field.name,
      description: field.description,
      annotation: genericAnnotation
    };
  }

  private handleFieldValue(field: Field, variant: Variant) {
    let res;
    if (field.name === '__typename') {
      const annotations = variant.possibleTypes
        .map(type => {
          const annotation = t.stringLiteralTypeAnnotation();
          annotation.value = type.toString();
          return annotation;
        });

      res = {
        name: field.alias ? field.alias : field.name,
        description: field.description,
        annotation: t.unionTypeAnnotation(annotations)
      };
    } else {
      // TODO: Double check that this works
      res = {
        name: field.alias ? field.alias : field.name,
        description: field.description,
        annotation: this.typeAnnotationFromGraphQLType(field.type)
      };
    }

    return res;
  }

  public get output(): string {
    return this.printer.print();
  }

  scopeStackPush(name: string) {
    this.scopeStack.push(name);
  }

  scopeStackPop() {
    const popped = this.scopeStack.pop()
    return popped;
  }

}
