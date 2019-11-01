import { predictionsRegionMapping as regionMap } from 'amplify-provider-awscloudformation';

function getRegionMapping(service, type) {
  const Mappings = {
    RegionMapping: {},
  };
  const regionMapping = regionMap[service];
  Object.keys(regionMapping).forEach(region => {
    Mappings.RegionMapping[region] = {
      [type]: regionMapping[region],
    };
  });
  return Mappings;
}

function getAvailableRegion(service, region) {
  return regionMap[service][region];
}

export default {
  getRegionMapping,
  getAvailableRegion,
};
