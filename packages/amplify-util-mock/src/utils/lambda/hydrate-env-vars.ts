export type Resource = {
  resourceName: string;
  category: string;
  output: Record<string, string>;
};
export type Resources = Resource[];
export type ApiDetails = {
  apiName: string;
  apiKey: string;
  apiId: string;
  url: string;
  dataSources: {
    name: string;
    Arn: string;
    type: string;
  }[];
};
export function hydrateAllEnvVars(
  resources: Resources,
  sourceEnvVars: Record<string, string>,
  apiDetails?: ApiDetails,
): Record<string, string> {
  const outputMap: Record<string, object> = resources.reduce((acc: Record<string, object>, r) => {
    const category = r.category;
    const resourceName = r.resourceName.toLowerCase();
    const outputs = Object.entries(r.output || {}).reduce((sum, [name, value]) => {
      return { ...sum, [name.toLowerCase()]: value };
    }, {});

    return { ...acc, [category]: { ...acc.category, [resourceName]: outputs } };
  }, {});
  if (apiDetails) {
    outputMap.api = {
      ...outputMap.api,
      [apiDetails.apiName]: {
        graphqlapiendpointoutput: apiDetails.url,
        graphqlapikeyoutput: apiDetails.apiKey,
        graphqlapiidoutput: apiDetails.apiId,
        ...apiDetails.dataSources
          .filter(ds => ds.type === 'AMAZON_DYNAMODB')
          .reduce((acc, ds) => {
            return { ...acc, [`${ds.name}_NAME`.toLowerCase()]: ds.name, [`${ds.name}_ARN`.toLowerCase()]: ds.Arn };
          }, {}),
      },
    };
  }

  return Object.entries(sourceEnvVars).reduce((acc, [name, value]) => {
    const [category, resourceName, ...outputName] = name.split('_').map(f => f.toLowerCase());
    let computedValue = value;
    if (category && resourceName && outputName) {
      if (outputMap[category] && outputMap[category][resourceName] && outputMap[category][resourceName][outputName.join('_')]) {
        computedValue = outputMap[category][resourceName][outputName.join('_')];
      }
    }

    return { ...acc, [name]: computedValue };
  }, {});
}
