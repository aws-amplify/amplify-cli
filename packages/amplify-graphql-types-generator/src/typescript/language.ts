import { LegacyInlineFragment } from '../compiler/legacyIR';

import { pickedPropertyDeclarations } from './codeGeneration';
import { typeNameFromGraphQLType } from './types';

import { CodeGenerator } from '../utilities/CodeGenerator';
import { GraphQLType } from 'graphql';
import Maybe from 'graphql/tsutils/Maybe';

export interface Property {
  fieldName?: string;
  fieldType?: GraphQLType;
  propertyName?: string;
  type?: GraphQLType;
  description?: Maybe<string>;
  typeName?: string;
  isComposite?: boolean;
  isNullable?: boolean;
  fields?: any[];
  inlineFragments?: LegacyInlineFragment[];
  fragmentSpreads?: any;
  isOptional?: boolean;
  isArray?: boolean;
  isArrayElementNullable?: boolean | null;
}

export function interfaceDeclaration(
  generator: CodeGenerator,
  { interfaceName, noBrackets }: { interfaceName: string; noBrackets?: boolean },
  closure: () => void,
) {
  generator.printNewlineIfNeeded();
  generator.printNewline();
  generator.print(`export type ${interfaceName} = `);
  generator.pushScope({ typeName: interfaceName });
  if (noBrackets) {
    generator.withinBlock(closure, '', '');
  } else {
    generator.withinBlock(closure, '{', '}');
  }
  generator.popScope();
  generator.print(';');
}

export function propertyDeclaration(
  generator: CodeGenerator,
  { fieldName, type, propertyName, typeName, description, isOptional, isArray, isNullable, isArrayElementNullable }: Property,
  closure?: () => void,
) {
  const name = fieldName || propertyName;

  if (description) {
    description.split('\n').forEach(line => {
      generator.printOnNewline(`// ${line.trim()}`);
    });
  }

  if (closure) {
    generator.printOnNewline(name);

    if (isNullable || isOptional) {
      generator.print('?');
    }
    generator.print(': ');

    if (isArray) {
      generator.print(' Array<');
    }
    generator.pushScope({ typeName: name });

    generator.withinBlock(closure);

    generator.popScope();

    if (isArray) {
      if (isArrayElementNullable) {
        generator.print(' | null');
      }
      generator.print(' >');
    }

    if (isNullable) {
      generator.print(' | null');
    }
  } else {
    generator.printOnNewline(name);
    if (isOptional || isNullable) {
      generator.print('?');
    }
    generator.print(': ');

    if (isArray) {
      generator.print(' Array<');
    }
    generator.print(`${typeName || (type && typeNameFromGraphQLType(generator.context, type))}`);
    if (isArray) {
      if (isArrayElementNullable) {
        generator.print(' | null');
      }
      generator.print(' >');
    }

    // When typeName is passed as string it includes <typename> | null for nullable types.
    if (isNullable && (!typeName || isArray)) {
      generator.print(' | null');
    }
  }
  generator.print(',');
}

export function pickedPropertySetsDeclaration(
  generator: CodeGenerator,
  property: Property,
  propertySets: Property[][],
  standalone = false,
) {
  const { description, fieldName, propertyName, isNullable, isArray, isArrayElementNullable } = property;
  const name = fieldName || propertyName;

  if (description) {
    description.split('\n').forEach(line => {
      generator.printOnNewline(`// ${line.trim()}`);
    });
  }

  if (!standalone) {
    generator.printOnNewline(`${name}: `);
  }

  if (isArray) {
    generator.print(' Array<');
  }

  generator.pushScope({ typeName: name });

  generator.withinBlock(
    () => {
      propertySets.forEach((propertySet, index, propertySets) => {
        generator.withinBlock(() => {
          pickedPropertyDeclarations(generator, propertySet);
        });
        if (index !== propertySets.length - 1) {
          generator.print(' |');
        }
      });
    },
    '(',
    ')',
  );

  generator.popScope();

  if (isArray) {
    if (isArrayElementNullable) {
      generator.print(' | null');
    }
    generator.print(' >');
  }

  if (isNullable) {
    generator.print(' | null');
  }

  if (!standalone) {
    generator.print(',');
  }
}

export function methodDeclaration(
  generator: CodeGenerator,
  {
    methodName,
    returnType,
    async,
    args,
  }: {
    methodName: string;
    returnType: string;
    async: boolean;
    args: Array<string>;
  },
  closure: () => void,
) {
  generator.printNewline();
  if (async) generator.print('async ');
  generator.print(`${methodName}(${args.join(', ')}):${returnType}`);
  generator.pushScope({ methodName });
  generator.withinBlock(closure, '{', '}');
  generator.popScope();
}
