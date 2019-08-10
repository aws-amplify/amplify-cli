export type CloudFormationParseContext = {
  params: any;
  conditions: object;
  resources: object;
  exports: object;
};

export type CloudFormationWalkContext = CloudFormationParseContext & {
  walkFn: Function;
  parent: Object;
  path: string[];
};

export type AWSCloudFormationParameterDefinition = {
  Type: string;
  Default?: string;
  Description?: string;
};

export type AWSCloudFormationParametersBlock = {
  [key: string]: AWSCloudFormationParameterDefinition;
};
