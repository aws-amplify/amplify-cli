function getRegionMapping(context, service, type) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins['awscloudformation']);

  const Mappings = {
    RegionMapping: {},
  };
  const regionMapping = provider.predictionsRegionMap[service];
  Object.keys(regionMapping).forEach(region => {
    Mappings.RegionMapping[region] = {
      [type]: regionMapping[region],
    };
  });
  return Mappings;
}

function getAvailableRegion(context, service, region) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins['awscloudformation']);

  return provider.predictionsRegionMap[service][region];
}

export default {
  getRegionMapping,
  getAvailableRegion,
};
