import { $TSObject } from 'amplify-cli-core';

const defaultLocationRegion = 'us-east-1';
const serviceRegionMap = {
  'us-east-1': 'us-east-1',
  'us-east-2': 'us-east-2',
  'us-west-2': 'us-west-2',
  'ap-southeast-1': 'ap-southeast-1',
  'ap-southeast-2': 'ap-southeast-2',
  'ap-northeast-1': 'ap-northeast-1',
  'eu-central-1': 'eu-central-1',
  'eu-north-1': 'eu-north-1',
  'eu-west-1': 'eu-west-1',
  'sa-east-1': 'us-east-1',
  'ca-central-1': 'us-east-1',
  'us-west-1': 'us-west-2',
  'cn-north-1': 'us-west-2',
  'cn-northwest-1': 'us-west-2',
  'ap-south-1': 'us-west-2',
  'ap-northeast-3': 'us-west-2',
  'ap-northeast-2': 'us-west-2',
  'eu-west-2': 'eu-west-1',
  'eu-west-3': 'eu-west-1',
  'me-south-1': 'ap-southeast-1'
};

export const getLocationSupportedRegion = (region: string): string => {
    if (serviceRegionMap[region]) {
    return serviceRegionMap[region];
    }
    return defaultLocationRegion;
};

export const getLocationRegionMapping = (): $TSObject => {
    return serviceRegionMap;
}
