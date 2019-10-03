
const Translate = {
  'us-east-1': 'us-east-1',
  'us-east-2': 'us-east-1',
  'us-west-2': 'us-west-2',
  'eu-west-1': 'eu-west-1',
  'eu-west-2': 'eu-west-1',
  'eu-central-1': 'eu-central-1',
  'ap-northeast-1': 'ap-northeast-1',
  'ap-northeast-2': 'ap-northeast-2',
  'ap-southeast-1': 'ap-southeast-1',
  'ap-southeast-2': 'ap-southeast-1',
  'ap-south-1': 'ap-south-1',
};


const Polly = {
  'us-east-1': 'us-east-1',
  'us-east-2': 'us-east-2',
  'us-west-2': 'us-west-2',
  'eu-west-1': 'eu-west-1',
  'eu-west-2': 'eu-west-2',
  'eu-central-1': 'eu-central-1',
  'ap-northeast-1': 'ap-northeast-1',
  'ap-northeast-2': 'ap-northeast-2',
  'ap-southeast-1': 'ap-southeast-1',
  'ap-southeast-2': 'ap-southeast-2',
  'ap-south-1': 'ap-south-1',
};

const Transcribe = {
  'us-east-1': 'us-east-1',
  'us-east-2': 'us-east-2',
  'us-west-2': 'us-west-2',
  'eu-west-1': 'eu-west-1',
  'eu-west-2': 'eu-west-2',
  'eu-central-1': 'eu-central-1',
  'ap-northeast-1': 'ap-northeast-2',
  'ap-northeast-2': 'ap-northeast-2',
  'ap-southeast-1': 'ap-southeast-1',
  'ap-southeast-2': 'ap-southeast-2',
  'ap-south-1': 'ap-south-1',
};

const Rekognition = {
  'us-east-1': 'us-east-1',
  'us-east-2': 'us-east-2',
  'us-west-2': 'us-west-2',
  'eu-west-1': 'eu-west-1',
  'eu-west-2': 'eu-west-2',
  'eu-central-1': 'eu-central-1',
  'ap-northeast-1': 'ap-northeast-1',
  'ap-northeast-2': 'ap-northeast-2',
  'ap-southeast-1': 'ap-southeast-1',
  'ap-southeast-2': 'ap-southeast-2',
  'ap-south-1': 'ap-south-1',
};

const RekognitionAndTextract = {
  'us-east-1': 'us-east-1',
  'us-east-2': 'us-east-2',
  'us-west-2': 'us-west-2',
  'eu-west-1': 'eu-west-1',
  'eu-west-2': 'us-east-1',
  'eu-central-1': 'us-east-1',
  'ap-northeast-1': 'us-east-1',
  'ap-northeast-2': 'us-east-1',
  'ap-southeast-1': 'us-east-1',
  'ap-southeast-2': 'us-east-1',
  'ap-south-1': 'us-east-1',
};

const Comprehend = {
  'us-east-1': 'us-east-1',
  'us-east-2': 'us-east-2',
  'us-west-2': 'us-west-2',
  'eu-west-1': 'eu-west-1',
  'eu-west-2': 'eu-west-2',
  'eu-central-1': 'eu-central-1',
  'ap-northeast-1': 'us-east-1',
  'ap-northeast-2': 'us-east-1',
  'ap-southeast-1': 'ap-southeast-1',
  'ap-southeast-2': 'ap-southeast-2',
  'ap-south-1': 'us-east-1',
};

const SageMaker = {
  'us-east-1': 'us-east-1',
  'us-east-2': 'us-east-2',
  'us-west-2': 'us-west-2',
  'eu-west-1': 'eu-west-1',
  'eu-west-2': 'eu-west-2',
  'eu-central-1': 'eu-central-1',
  'ap-northeast-1': 'ap-northeast-1',
  'ap-northeast-2': 'ap-northeast-2',
  'ap-southeast-1': 'ap-southeast-1',
  'ap-southeast-2': 'ap-southeast-2',
  'ap-south-1': 'ap-south-1',
};

const regionMap = {
  Translate,
  Polly,
  Transcribe,
  Rekognition,
  RekognitionAndTextract,
  Comprehend,
  SageMaker,
};

function getRegionMapping(service, type) {
  const Mappings = {
    RegionMapping: {},
  };
  const regionMapping = regionMap[service];
  Object.keys(regionMapping).forEach((region) => {
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
