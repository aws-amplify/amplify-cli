import { isArray, isPlainObject } from 'lodash';

import { cfnJoin, cfnSub, cfnSelect, cfnAnd, cfnCondition, cfnEquals, cfnGetAtt, cfnIf, cfnImportValue, cfnNot, cfnOr, cfnRef, cfnSplit } from './intrinsic-functions';
import { CloudFormationParseContext } from './types'

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

// Add know intrinsic functions
addIntrinsicFunction('Fn::Join', cfnJoin);
addIntrinsicFunction('Fn::Sub', cfnSub);
addIntrinsicFunction('Fn::GetAtt', cfnGetAtt);
addIntrinsicFunction('Fn::Split', cfnSplit);
addIntrinsicFunction('Ref', cfnRef);
addIntrinsicFunction('Fn::Select', cfnSelect);
addIntrinsicFunction('Fn::If', cfnIf);
addIntrinsicFunction('Fn::Equals', cfnEquals);
addIntrinsicFunction('Fn::And', cfnAnd);
addIntrinsicFunction('Fn::Or', cfnOr);
addIntrinsicFunction('Fn::Not', cfnNot);
addIntrinsicFunction('Condition', cfnCondition);
