import { parseValue } from 'graphql';
import { defaultProviderMap } from '../auth';

export function createNameNode(name: any) {
  return {
    kind: 'Name',
    value: name,
  };
}

export function createDirectiveNode(name: any, args: any) {
  return {
    kind: 'Directive',
    name: createNameNode(name),
    arguments: args,
  };
}

export function createArgumentNode(name: any, value: any) {
  return {
    kind: 'Argument',
    name: createNameNode(name),
    value: value,
  };
}

export function createListValueNode(values: any) {
  return {
    kind: 'ListValue',
    values: values,
  };
}

/**
 * Note this only supports strategy, provider and operations. Group and owner auth is not supported
 */
export function createAuthRule(strategy: any, provider: any, operations?: any) {
  let rule = `{allow: ${strategy}`;
  if (provider && provider !== defaultProviderMap.get(strategy)) {
    rule += `, provider: ${provider}`;
  }

  if (operations && operations.length !== 4) {
    rule += `, operations: [${operations.join(', ')}]`;
  }
  rule += '}';
  return parseValue(rule);
}
