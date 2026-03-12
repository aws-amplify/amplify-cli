/**
 * CloudFormation template shape types.
 *
 * These types model the structure of a CloudFormation template as parsed from JSON.
 * No logic — just shapes.
 */

export interface CFNOutput {
  readonly Description?: string;
  Value: string | object;
}

export enum CFNFunction {
  Equals = 'Fn::Equals',
  Not = 'Fn::Not',
  Or = 'Fn::Or',
  And = 'Fn::And',
  If = 'Fn::If',
}

export type CFNIntrinsicFunctionCondition = {
  readonly Condition: string;
};

export type CFNConditionFunctionStatement = string | object | CFNConditionFunction | CFNIntrinsicFunctionCondition;

export type CFNConditionFunction =
  | { readonly [CFNFunction.Equals]: [CFNConditionFunctionStatement, CFNConditionFunctionStatement] }
  | { readonly [CFNFunction.Not]: [CFNConditionFunctionStatement] }
  | { readonly [CFNFunction.Or]: [CFNConditionFunctionStatement, CFNConditionFunctionStatement] }
  | { readonly [CFNFunction.And]: [CFNConditionFunctionStatement, CFNConditionFunctionStatement] };

export interface CFNResource {
  readonly Type: string;
  readonly Properties: Record<string, string | number | object>;
  readonly Condition?: string;
  // DependsOn is mutable: resolvers and buildRefactorTemplates remap dependencies on cloned templates.
  DependsOn?: string | string[];
}

export interface CFNParameter {
  readonly Type: string;
  readonly Default?: string;
  readonly Description?: string;
  readonly NoEcho?: boolean;
}

export interface CFNTemplate {
  readonly Description: string;
  readonly AWSTemplateFormatVersion: string;
  readonly Conditions?: Record<string, CFNConditionFunction>;
  readonly Parameters?: Record<string, CFNParameter>;
  // Resources and Outputs are mutable: resolvers clone templates then transform them in place.
  // The clone-then-mutate pattern is the standard way to produce modified templates.
  Resources: Record<string, CFNResource>;
  Outputs: Record<string, CFNOutput>;
}

export enum CFNStackStatus {
  UPDATE_COMPLETE = 'UPDATE_COMPLETE',
  CREATE_COMPLETE = 'CREATE_COMPLETE',
}

export enum CFN_PSEUDO_PARAMETERS_REF {
  StackName = 'AWS::StackName',
}
