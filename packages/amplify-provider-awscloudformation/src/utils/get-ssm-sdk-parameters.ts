export const getSsmSdkParametersDeleteMultiKeys = (appId: string, envName: string, keys: Array<string>) => {
  const sdkParameters = {
    Names: keys.map(key => `/amplify/${appId}/${envName}/${key}`),
  };
  return sdkParameters;
};
