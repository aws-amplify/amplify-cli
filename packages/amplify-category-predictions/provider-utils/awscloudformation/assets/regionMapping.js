import { predictionsRegionMap } from 'amplify-provider-awscloudformation';

function getRegionMapping(service, type) {
  const Mappings = {
    RegionMapping: {},
  };
  const regionMapping = predictionsRegionMap[service];
  Object.keys(regionMapping).forEach(region => {
    Mappings.RegionMapping[region] = {
      [type]: regionMapping[region],
    };
  });
  return Mappings;
}

function getAvailableRegion(service, region) {
  return predictionsRegionMap[service][region];
}

export default {
  getRegionMapping,
  getAvailableRegion,
};
