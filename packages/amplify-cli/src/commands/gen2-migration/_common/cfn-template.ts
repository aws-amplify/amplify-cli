/**
 * CloudFormation template shape types.
 *
 * These types model the structure of a CloudFormation template as parsed from JSON.
 * No logic — just shapes.
 */

import { $TSAny } from '@aws-amplify/amplify-cli-core';

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
  readonly Properties: Record<string, string | number | boolean | object>;
  readonly Condition?: string;

  // mutable because we change these during `lock`.
  UpdateReplacePolicy?: string;
  DeletionPolicy?: string;

  // mutable because resolvers and buildBlueprint remap dependencies on cloned templates.
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
  // Optional because CDK omits Outputs when a stack has no cross-stack references.
  Outputs?: Record<string, CFNOutput>;

  // Optional because not all templates have metadata.
  Metadata?: Record<string, $TSAny>;
}

export enum CFNStackStatus {
  UPDATE_COMPLETE = 'UPDATE_COMPLETE',
  CREATE_COMPLETE = 'CREATE_COMPLETE',
}

export enum CFN_PSEUDO_PARAMETERS_REF {
  StackName = 'AWS::StackName',
}
