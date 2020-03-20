import { isPlainObject } from 'lodash';

import { CloudFormationParseContext } from './types';

const intrinsicFunctionMap = {};

export function addIntrinsicFunction(keyword: string, func: (node, cfnContext: CloudFormationParseContext, parse: Function) => void) {
  intrinsicFunctionMap[keyword] = func;
}

export function parseValue(node, context: CloudFormationParseContext) {
  if (['string', 'number'].includes(typeof node)) return node;

  // convert object to plain object
  node = JSON.parse(JSON.stringify(node));
  if (isPlainObject(node) && Object.keys(node).length === 1 && Object.keys(intrinsicFunctionMap).includes(Object.keys(node)[0])) {
    const op = Object.keys(node)[0];
    const valNode = node[op];
    return intrinsicFunctionMap[op](valNode, context, parseValue);
  }
  throw new Error(`Could not process value node ${JSON.stringify(node)}`);
}
