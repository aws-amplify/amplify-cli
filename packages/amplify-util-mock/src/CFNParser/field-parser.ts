import { isPlainObject } from 'lodash';

import { CloudFormationParseContext } from './types';

const intrinsicFunctionMap = {};

export function addIntrinsicFunction(
  keyword: string,
  func: (node, cfnContext: CloudFormationParseContext, parse: Function) => void
) {
  intrinsicFunctionMap[keyword] = func;
}

export function parseValue(node, context: CloudFormationParseContext) {
  if (typeof node === 'string') return node;

  if (
    isPlainObject(node) &&
    Object.keys(node).length === 1 &&
    Object.keys(intrinsicFunctionMap).includes(Object.keys(node)[0])
  ) {
    const op = Object.keys(node)[0];
    const valNode = node[op];
    return intrinsicFunctionMap[op](valNode, context, parseValue);
  }
  throw new Error(`Could not process value node ${JSON.stringify(node)}`);
}
