import { CfnMapping, Construct } from '@aws-cdk/core';

export function setMappings(scope: Construct): CfnMapping {
  return new CfnMapping(scope, 'LayerResourceMapping', {
    mapping: {
      'ap-northeast-1': {
        layerRegion: 'arn:aws:lambda:ap-northeast-1:249908578461:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'us-east-1': {
        layerRegion: 'arn:aws:lambda:us-east-1:668099181075:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'ap-southeast-1': {
        layerRegion: 'arn:aws:lambda:ap-southeast-1:468957933125:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'eu-west-1': {
        layerRegion: 'arn:aws:lambda:eu-west-1:399891621064:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'us-west-1': {
        layerRegion: 'arn:aws:lambda:us-west-1:325793726646:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'ap-east-1': {
        layerRegion: 'arn:aws:lambda:ap-east-1:118857876118:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'ap-northeast-2': {
        layerRegion: 'arn:aws:lambda:ap-northeast-2:296580773974:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'ap-northeast-3': {
        layerRegion: 'arn:aws:lambda:ap-northeast-3:961244031340:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'ap-south-1': {
        layerRegion: 'arn:aws:lambda:ap-south-1:631267018583:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'ap-southeast-2': {
        layerRegion: 'arn:aws:lambda:ap-southeast-2:817496625479:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'ca-central-1': {
        layerRegion: 'arn:aws:lambda:ca-central-1:778625758767:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'eu-central-1': {
        layerRegion: 'arn:aws:lambda:eu-central-1:292169987271:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'eu-north-1': {
        layerRegion: 'arn:aws:lambda:eu-north-1:642425348156:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'eu-west-2': {
        layerRegion: 'arn:aws:lambda:eu-west-2:142628438157:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'eu-west-3': {
        layerRegion: 'arn:aws:lambda:eu-west-3:959311844005:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'sa-east-1': {
        layerRegion: 'arn:aws:lambda:sa-east-1:640010853179:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'us-east-2': {
        layerRegion: 'arn:aws:lambda:us-east-2:259788987135:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'us-west-2': {
        layerRegion: 'arn:aws:lambda:us-west-2:420165488524:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'cn-north-1': {
        layerRegion: 'arn:aws-cn:lambda:cn-north-1:683298794825:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'cn-northwest-1': {
        layerRegion: 'arn:aws-cn:lambda:cn-northwest-1:382066503313:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'us-gov-west-1': {
        layerRegion: 'arn:aws-us-gov:lambda:us-gov-west-1:556739011827:layer:AWSLambda-Python-AWS-SDK:1',
      },
      'us-gov-east-1': {
        layerRegion: 'arn:aws-us-gov:lambda:us-gov-east-1:138526772879:layer:AWSLambda-Python-AWS-SDK:1',
      },
    },
  });
}
