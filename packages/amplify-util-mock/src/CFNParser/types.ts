export type CloudFormationParsedResource = {
  Type: string;
  result: {
    [key: string]: any;
  };
};

export type CloudFormationParseContext = {
  params: any;
  conditions: object;
  resources: Record<string, CloudFormationParsedResource>;
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
