export type CloudFormationParameter = {
  Type: string;
  Description?: string;
  Default?: String | Number;
};
export type CloudFormationFnIf = {
  'Fn::If': [string, CloudFormationIntrinsicFunction, CloudFormationIntrinsicFunction];
};
export type CloudFormationFnAnd = {
  'Fn::And': CloudFormationIntrinsicFunction[];
};
export type CloudFormationFnEqual = {
  'Fn::Equals': [CloudFormationIntrinsicFunction, CloudFormationIntrinsicFunction];
};
export type CloudFormationFnNot = {
  'Fn::Not': [CloudFormationIntrinsicFunction];
};
export type CloudFormationFnOr = {
  'Fn::Or': CloudFormationIntrinsicFunction[];
};
export type CloudFormationFnFindInMap = {
  'Fn::FindInMap': [string, CloudFormationIntrinsicFunction, CloudFormationIntrinsicFunction];
};
export type CloudFormationRef = {
  Ref: string;
};
export type CloudFormationFnGetAtt = {
  'Fn::GetAtt': [string, CloudFormationRef | string];
};
export type CloudFormationFnBase64 = {
  'Fn::Base64': string;
};
export type CloudFormationFnImportValue = {
  'Fn::ImportValue': CloudFormationIntrinsicFunction; // limit to subset (Fn::Base64, Fn::FindInMap, Fn::If, Fn::Join, Fn::Select, Fn::Split, Fn::Sub, Ref)
};
export type CloudFormationFnJoin = {
  'Fn::Join': [string, CloudFormationIntrinsicFunction[]];
};
export type CloudFormationFnSelect = {
  'Fn::Select': [number, ...CloudFormationIntrinsicFunction[]]; // limit subset(Fn::FindInMap,Fn::GetAtt,Fn::GetAZs,Fn::If,Fn::Split,Ref)
};
export type CloudFormationFnSplit = {
  'Fn::Split': [string, ...CloudFormationIntrinsicFunction[]]; // limit subset (Fn::Base64,Fn::FindInMap,Fn::GetAtt,Fn::GetAZs,Fn::If,Fn::ImportValue,Fn::Join,Fn::Select,Fn::Sub,Ref)
};
export type CloudFormationFnSub = {
  'Fn::Sub': [string, ...CloudFormationIntrinsicFunction[]]; //Fn::Base64,Fn::FindInMap,Fn::GetAtt,Fn::GetAZs,Fn::If,Fn::ImportValue,Fn::Join,Fn::Select,Ref
};
export type CloudFormationIntrinsicConditionFunction =
  | CloudFormationFnIf
  | CloudFormationFnAnd
  | CloudFormationFnEqual
  | CloudFormationFnNot
  | CloudFormationFnOr;
export type CloudFormationIntrinsicFunction =
  | String
  | CloudFormationIntrinsicConditionFunction
  | CloudFormationFnFindInMap
  | CloudFormationRef
  | CloudFormationFnGetAtt
  | CloudFormationFnImportValue
  | CloudFormationFnJoin
  | CloudFormationFnSelect
  | CloudFormationFnSplit
  | CloudFormationFnSub;
export type CloudFormationProperty = string | CloudFormationIntrinsicFunction;
export interface CloudFormationResourceProperty {
  [name: string]: CloudFormationIntrinsicFunction | CloudFormationResourceProperty;
}
export type CloudFormationResource = {
  Type: string;
  Properties: CloudFormationResourceProperty;
  DependsOn?: string[];
  Condition?: string;
};
export type CloudFormationResources = Record<string, CloudFormationResource>;
export type CloudFormationOutput = {
  Value: CloudFormationIntrinsicFunction;
  Description?: string;
  Export?: {
    Name: string | CloudFormationIntrinsicFunction;
  };
};
export type CloudFormationOutputs = Record<string, CloudFormationOutput>;
export type CloudFormationConditions = Record<string, CloudFormationIntrinsicConditionFunction>;
export type CloudFormationParameters = Record<string, CloudFormationParameter>;
export type CloudFormationTemplate = {
  Parameters?: CloudFormationParameters;
  Resources: CloudFormationResources;
  Conditions?: CloudFormationConditions;
  Outputs?: CloudFormationOutputs;
};

export type CloudFormationProcessedResourceResult = {
  cfnExposedAttributes: Record<string, string>;
  arn?: string;
  ref?: String;
};

export type CloudFormationProcessedResource = {
  Type: String;
  result: CloudFormationProcessedResourceResult;
};

export type CloudFormationTemplateFetcher = {
  getCloudFormationStackTemplate: (templateName: string) => CloudFormationTemplate;
};
