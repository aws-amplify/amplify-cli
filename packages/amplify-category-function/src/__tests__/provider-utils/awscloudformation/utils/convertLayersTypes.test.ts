import {
  convertProjectLayersToExternalLayers,
  covertExternalLayersToProjectLayers,
} from '../../../../provider-utils/awscloudformation/utils/convertLayersTypes';
import { LambdaLayer } from 'amplify-function-plugin-interface';
import { convertProjectLayer } from '../../../../provider-utils/awscloudformation/utils/layerArnConverter';

jest.mock('../../../../provider-utils/awscloudformation/utils/layerArnConverter');

const convertProjectLayer_mock = convertProjectLayer as jest.MockedFunction<typeof convertProjectLayer>;
convertProjectLayer_mock.mockReturnValue({ 'Fn::Sub': 'mockLayerArn' });

describe('convert ProjectLayer when checkout env if required', () => {
  const envName = 'prod';
  const lambdaLayers: LambdaLayer[] = [
    {
      type: 'ProjectLayer',
      resourceName: 'mocklayer1',
      version: 1,
      isLatestVersionSelected: false,
      env: 'prod',
    },
    {
      type: 'ProjectLayer',
      resourceName: 'mocklayer2',
      version: 2,
      isLatestVersionSelected: false,
      env: 'dev',
    },
    {
      type: 'ProjectLayer',
      resourceName: 'mocklayer3',
      version: 3,
      isLatestVersionSelected: false,
      env: 'prod',
    },
    {
      type: 'ProjectLayer',
      resourceName: 'mocklayer4',
      version: 4,
      isLatestVersionSelected: true,
      env: 'staging',
    },
  ];
  test('when add/checkout to same env', () => {
    expect(convertProjectLayersToExternalLayers(lambdaLayers, envName)).toMatchSnapshot();
  });
});

describe('convert ExternalLayer when checkout env if required', () => {
  const envName = 'dev';
  const lambdaLayers: LambdaLayer[] = [
    {
      type: 'ExternalLayer',
      arn: {
        'Fn::Sub': 'arn:aws:lambda:mockRegion:mockaccountId:layer:mocklayer1-dev:1',
      },
    },
    {
      type: 'ExternalLayer',
      arn: {
        'Fn::Sub': 'arn:aws:lambda:mockRegion:mockaccountId:layer:mocklayer2-dev:2',
      },
    },
    {
      type: 'ExternalLayer',
      arn: {
        'Fn::Sub': 'arn:aws:lambda:mockRegion:mockaccountId:layer:mocklayer3-prod:3',
      },
    },
    {
      type: 'ExternalLayer',
      arn: {
        'Fn::Sub': 'arn:aws:lambda:mockRegion:mockaccountId:layer:mocklayer4-staging:4',
      },
    },
    {
      type: 'ExternalLayer',
      arn: {
        'Fn::Sub': 'arn:aws:lambda:mockRegion:mockaccountId:layer:mocklayer5-dev:5',
      },
    },
  ];

  test('when add/checkout to env', () => {
    expect(covertExternalLayersToProjectLayers(lambdaLayers, envName)).toMatchSnapshot();
  });
});
