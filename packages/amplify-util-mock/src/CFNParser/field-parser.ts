import { isPlainObject } from 'lodash';
import { CloudFormationParseContext } from './types';

import {
  cfnAnd,
  cfnCondition,
  cfnEquals,
  cfnGetAtt,
  cfnIf,
  cfnJoin,
  cfnNot,
  cfnOr,
  cfnRef,
  cfnSelect,
  cfnSplit,
  cfnSub,
  cfnImportValue,
} from './intrinsic-functions';

const intrinsicFunctionMap = {
  'Fn::Join': cfnJoin,
  'Fn::Sub': cfnSub,
  'Fn::GetAtt': cfnGetAtt,
  'Fn::Split': cfnSplit,
  Ref: cfnRef,
  'Fn::Select': cfnSelect,
  'Fn::If': cfnIf,
  'Fn::Equals': cfnEquals,
  'Fn::And': cfnAnd,
  'Fn::Or': cfnOr,
  'Fn::Not': cfnNot,
  Condition: cfnCondition,
  'Fn::ImportValue': cfnImportValue,
};

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
