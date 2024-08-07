export type CloudFormationParsedResource = {
  Type: string;
  result: {
    [key: string]: any;
  };
};

export type CloudFormationParseContext = {
  params: Record<string, string>;
  conditions: object;
  resources: Record<string, CloudFormationParsedResource>;
  exports: Record<string, string>;
};

export type CloudFormationWalkContext = CloudFormationParseContext & {
  walkFn: (...args: unknown[]) => unknown;
  parent: Record<string, unknown>;
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
