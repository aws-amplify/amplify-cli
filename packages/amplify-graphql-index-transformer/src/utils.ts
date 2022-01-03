import { InvalidDirectiveError } from '@aws-amplify/graphql-transformer-core';
import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { plurality, toUpper } from 'graphql-transformer-common';
import { IndexDirectiveConfiguration, PrimaryKeyDirectiveConfiguration } from './types';

export function lookupResolverName(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider, op: string): string | null {
  const { object, modelDirective } = config;
  const argName = op === 'get' || op === 'list' || op === 'sync' ? 'queries' : 'mutations';
  let resolverName;

  // Check if @model overrides the default resolver names.
  for (const argument of modelDirective.arguments!) {
    const arg = argument as any;

    if (arg.name.value !== argName || !Array.isArray(arg.value.fields)) {
      continue;
    }

    for (const field of arg.value.fields) {
      if (field.name.value === op) {
        resolverName = field.value.value;

        if (!resolverName) {
          return null;
        }
      }
    }
  }

  if (!resolverName) {
    const capitalizedName = toUpper(object.name.value);

    if (op === 'list' || op === 'sync') {
      resolverName = `${op}${plurality(capitalizedName, true)}`;
    } else {
      resolverName = `${op}${capitalizedName}`;
    }
  }

  return resolverName;
}

export function validateNotSelfReferencing(config: IndexDirectiveConfiguration | PrimaryKeyDirectiveConfiguration) {
  const { directive, field, sortKeyFields } = config;
  const fieldName = field.name.value;

  for (const sortKeyField of sortKeyFields) {
    if (sortKeyField === fieldName) {
      throw new InvalidDirectiveError(`@${directive.name.value} field '${fieldName}' cannot reference itself.`);
    }
  }
}
