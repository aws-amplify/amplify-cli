const askShouldTryWithDifferentRegion = require('./questions/changeRegion');
const changeRegion = require('./questions/selectRegions');

async function changeAppSyncRegion(context, currentRegion) {
  const regions = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getRegionMappings');

  const shouldRetry = await askShouldTryWithDifferentRegion();
  const region = shouldRetry && (await changeRegion(regions, currentRegion));
  return {
    shouldRetry,
    region,
  };
}

module.exports = changeAppSyncRegion;
