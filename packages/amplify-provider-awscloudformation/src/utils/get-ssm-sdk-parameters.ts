export const getSsmSdkParametersDeleteParameters = (keys: Array<string>): SsmDeleteParameters => {
  const sdkParameters = {
    Names: keys,
  };
  return sdkParameters;
};

export const getSsmSdkParametersGetParametersByPath = (
  appId: string,
  envName: string,
  nextToken?: string,
): SsmGetParametersByPathArgument => {
  const sdkParameters: SsmGetParametersByPathArgument = {
    Path: `/amplify/${appId}/${envName}/`,
  };
  if (nextToken) {
    sdkParameters.NextToken = nextToken;
  }
  return sdkParameters;
};

type SsmDeleteParameters = {
  Names: Array<string>;
};

type SsmGetParametersByPathArgument = {
  Path: string;
  NextToken?: string;
};
