import { addIntrinsicFunction } from './field-parser';

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
addIntrinsicFunction('Fn::ImportValue', cfnImportValue);

export { addIntrinsicFunction } from './field-parser';
export { processTransformerStacks as processAppSyncResources } from './appsync-resource-processor';
