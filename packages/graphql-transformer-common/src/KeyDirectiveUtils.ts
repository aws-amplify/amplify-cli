import { ObjectTypeDefinitionNode } from 'graphql';
import { pascalCase } from 'change-case';
import { plural } from 'pluralize';
export interface KeyDirectiveArguments {
  name?: string;
  fields: string[];
  queryField?: string;
  generateQuery?: boolean;
}

export function getKeyDirectiveQueryFieldName(definition: ObjectTypeDefinitionNode, directiveArgs: KeyDirectiveArguments): string {
  if (!directiveArgs.name) throw new Error("KeyDirective without name can't have queryField");
  if (directiveArgs.queryField) return directiveArgs.queryField;
  return `query${plural(definition.name.value)}${pascalCase(directiveArgs.name)}`;
}

export function shouldKeyDirectiveGenerateQuery(directiveArgs: KeyDirectiveArguments): boolean {
  // False when the its primary index
  if (!directiveArgs.name) return false;

  // 1. When generateQuery is explictly set honor that
  if (typeof directiveArgs.generateQuery !== 'undefined') return directiveArgs.generateQuery;

  return true;
}
