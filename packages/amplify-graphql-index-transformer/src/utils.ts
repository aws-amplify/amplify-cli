import { TransformerContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { plurality } from 'graphql-transformer-common';
import { PrimaryKeyDirectiveConfiguration } from './types';

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
    if (op === 'list' || op === 'sync') {
      resolverName = `${op}${plurality(object.name.value, true)}`;
    } else {
      resolverName = `${op}${object.name.value}`;
    }
  }

  return resolverName;
}
