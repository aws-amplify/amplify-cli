function getRegionMapping(context: any, service: any, type: any) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins['awscloudformation']);

  const Mappings = {
    RegionMapping: {},
  };
  const regionMapping = provider.predictionsRegionMap[service];
  Object.keys(regionMapping).forEach(region => {
    // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    Mappings.RegionMapping[region] = {
      [type]: regionMapping[region],
    };
  });
  return Mappings;
}

function getAvailableRegion(context: any, service: any, region: any) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins['awscloudformation']);

  return provider.predictionsRegionMap[service][region];
}

export default {
  getRegionMapping,
  getAvailableRegion,
};
