import { GraphQLNonNull, GraphQLType, isScalarType } from 'graphql';
import * as prettier from 'prettier';
import {
  LegacyCompilerContext,
  LegacyOperation,
  LegacyInlineFragment,
  LegacyField
} from '../compiler/legacyIR';

import CodeGenerator from '../utilities/CodeGenerator';
import {
  typeDeclarationForGraphQLType,
  interfaceDeclarationForFragment,
  propertiesFromFields,
  updateTypeNameField,
  propertyDeclarations,
  interfaceNameFromOperation
} from '../typescript/codeGeneration';
import { typeNameFromGraphQLType } from '../typescript/types';
import { Property, interfaceDeclaration } from '../typescript/language';

export function generateSource(context: LegacyCompilerContext) {
  const generator = new CodeGenerator<LegacyCompilerContext>(context);

  generator.printOnNewline('/* tslint:disable */');
  generator.printOnNewline('//  This file was automatically generated and should not be edited.');

  generator.printOnNewline(`import { Injectable } from '@angular/core';`);
  generator.printOnNewline(`import API, { graphqlOperation } from '@aws-amplify/api';`);
  generator.printOnNewline(`import { GraphQLResult } from "@aws-amplify/api/lib/types";`);

  generator.printOnNewline(`import * as Observable from 'zen-observable';`);
  generator.printNewline();

  generateTypes(generator, context);
  generator.printNewline();

  generateAngularService(generator, context);
  return prettier.format(generator.output, { parser: 'typescript' });
}

function generateTypes(generator: CodeGenerator, context: LegacyCompilerContext) {
  context.typesUsed.forEach(type => typeDeclarationForGraphQLType(generator, type));

  Object.values(context.operations).forEach(operation => {
    interfaceDeclarationForOperation(generator, operation);
  });

  Object.values(context.fragments).forEach(operation =>
    interfaceDeclarationForFragment(generator, operation)
  );
}

function interfaceDeclarationForOperation(
  generator: CodeGenerator,
  { operationName, operationType, fields }: LegacyOperation
) {
  const interfaceName = interfaceNameFromOperation({ operationName, operationType });
  fields = fields.map(field => updateTypeNameField(field));

  // Graphql result includes the name of operation as the top level key in response JSON
  // We are only interested in the shape of the response object and not the name of operation
  // if the name of query is getAudioAlbum then the response object will look
  // {
  //   getAudioAlbum: {
  //     __typename: "AudioAlbum";
  //     id: string;
  //     title: string | null;
  //     tracks: Array<{
  //       __typename: "Track";
  //       id: string;
  //       title: string | null;
  //     } | null> | null;
  //   }
  // }
  // but the interface is needed only for the result value of getAudioAlbum
  if (fields[0].fields) { // execute only if there are sub fields
    const properties = propertiesFromFields(generator.context, fields[0].fields as LegacyField[]);
    interfaceDeclaration(
      generator,
      {
        interfaceName
      },
      () => {
        propertyDeclarations(generator, properties);
      }
    );
  }

}

function getOperationResultField(operation: LegacyOperation): LegacyField | void {
  if (operation.fields.length && operation.fields[0].fields) {
    return operation.fields[0];
  }
}

function getReturnTypeName(generator: CodeGenerator, op: LegacyOperation): String {
  const { operationName, operationType } = op;
  if (isScalarType(op.fields[0].type)) {
    return typeNameFromGraphQLType(generator.context, op.fields[0].type)
  } else {
    return interfaceNameFromOperation({ operationName, operationType });
  }
}

function generateAngularService(generator: CodeGenerator, context: LegacyCompilerContext) {
  const operations = context.operations;
  generator.printOnNewline(`@Injectable({
    providedIn: 'root'
  })`);
  generator.printOnNewline(`export class APIService {`);

  generator.withIndent(() => {
    Object.values(operations).forEach((op: LegacyOperation) => {
      if (op.operationType === 'subscription') {
        return generateSubscriptionOperation(generator, op);
      }
      if (op.operationType === 'query' || op.operationType === 'mutation') {
        return generateQueryOrMutationOperation(generator, op);
      }
    });
    generator.printOnNewline('}');
  });
}

function generateSubscriptionOperation(generator: CodeGenerator, op: LegacyOperation) {
  const statement = formatTemplateString(generator, op.source);
  const { operationName } = op;
  const returnType = getReturnTypeName(generator, op);
  generator.printNewline();
  const subscriptionName = `${operationName}Listener`;
  generator.print(
    `${subscriptionName}: Observable<${returnType}> = API.graphql(graphqlOperation(\n\`${statement}\`)) as Observable<${returnType}>`
  );
  generator.printNewline();
}

function generateQueryOrMutationOperation(generator: CodeGenerator, op: LegacyOperation) {
  const statement = formatTemplateString(generator, op.source);
  const vars = variablesFromField(generator.context, op.variables);
  const returnType = getReturnTypeName(generator, op);
  const resultField = getOperationResultField(op);
  const resultProp = resultField ? `.${resultField.responseName}` : '';

  generator.printNewline();
  generator.print(`async ${op.operationName}(`);
  variableDeclaration(generator, vars);
  generator.print(`) : Promise<${returnType}> {`);
  generator.withIndent(() => {
    generator.printNewlineIfNeeded();
    generator.print(`const statement = \`${statement}\``);
    const params = ['statement'];
    if (op.variables.length) {
      variableAssignmentToInput(generator, vars);
      params.push('gqlAPIServiceArguments');
    }
    generator.printOnNewline(
      `const response = await API.graphql(graphqlOperation(${params.join(', ')})) as any;`
    );
    generator.printOnNewline(`return (<${returnType}>response.data${resultProp})`);
  });
  generator.printOnNewline('}');
}

export function variablesFromField(
  context: LegacyCompilerContext,
  fields: {
    name?: string;
    type: GraphQLType;
    responseName?: string;
    description?: string;
    fragmentSpreads?: any;
    inlineFragments?: LegacyInlineFragment[];
    fieldName?: string;
  }[]
) {
  return fields.map(field => propertyFromVar(context, field));
}

export function propertyFromVar(
  context: LegacyCompilerContext,
  field: {
    name?: string;
    type: GraphQLType;
    fields?: any[];
    responseName?: string;
    description?: string;
    fragmentSpreads?: any;
    inlineFragments?: LegacyInlineFragment[];
    fieldName?: string;
  }
): Property {
  let { name: fieldName, type: fieldType } = field;
  fieldName = fieldName || field.responseName;

  const propertyName = fieldName;

  let property = { fieldName, fieldType, propertyName };

  let isNullable = true;
  if (fieldType instanceof GraphQLNonNull) {
    isNullable = false;
  }
  const typeName = typeNameFromGraphQLType(context, fieldType, null, false);
  return { ...property, typeName, isComposite: false, fieldType, isNullable };
}

function variableDeclaration(generator: CodeGenerator, properties: Property[]) {
  properties
    .sort((a, b) => {
      if (!a.isNullable && b.isNullable) {
        return -1;
      }
      if (!b.isNullable && a.isNullable) {
        return 1;
      }
      return 0;
    })
    .forEach(property => {
      const { fieldName, typeName, isArray, isNullable } = property;
      generator.print(fieldName);
      if (isNullable) {
        generator.print('?');
      }
      generator.print(':');
      if (isArray) {
        generator.print(' Array<');
      }
      generator.print(`${typeName}`);
      if (isArray) {
        generator.print('>');
      }
      generator.print(', ');
    });
}

function variableAssignmentToInput(generator: CodeGenerator, vars: Property[]) {
  if (vars.length > 0) {
    generator.printOnNewline('const gqlAPIServiceArguments : any = ');
    generator.withinBlock(
      () => {
        // non nullable arguments
        vars
          .filter(v => !v.isNullable)
          .forEach(v => {
            generator.printOnNewline(`${v.fieldName},`);
          });
      },
      '{',
      '}'
    );
    // null able arguments
    vars
      .filter(v => v.isNullable)
      .forEach(v => {
        generator.printOnNewline(`if (${v.fieldName}) `);
        generator.withinBlock(
          () => {
            generator.printOnNewline(`gqlAPIServiceArguments.${v.fieldName} = ${v.fieldName}`);
          },
          '{',
          '}'
        );
      });
  }
}

function formatTemplateString(generator: CodeGenerator, str: string): string {
  const indentation = ' '.repeat(
    generator.currentFile.indentWidth * (generator.currentFile.indentLevel + 2)
  );
  return str
    .split('\n')
    .map((line, idx) => (idx > 0 ? indentation + line : line))
    .join('\n');
}
