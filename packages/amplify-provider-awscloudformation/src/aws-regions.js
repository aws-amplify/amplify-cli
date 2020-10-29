// *** NOTE! ***
// If updating this list, also update the corresponding list in amplify-e2e-tests/src/configure/index.ts
// *** NOTE! ***
const regionMappings = {
  'us-east-1': 'US East (N. Virginia)',
  'us-east-2': 'US East (Ohio)',
  'us-west-2': 'US West (Oregon)',
  'eu-west-1': 'EU (Ireland)',
  'eu-west-2': 'EU (London)',
  'eu-central-1': 'EU (Frankfurt)',
  'ap-northeast-1': 'Asia Pacific (Tokyo)',
  'ap-northeast-2': 'Asia Pacific (Seoul)',
  'ap-southeast-1': 'Asia Pacific (Singapore)',
  'ap-southeast-2': 'Asia Pacific (Sydney)',
  'ap-south-1': 'Asia Pacific (Mumbai)',
  'ca-central-1': 'Canada (Central)',
};

module.exports = {
  regions: Object.keys(regionMappings),
  regionMappings,
};
