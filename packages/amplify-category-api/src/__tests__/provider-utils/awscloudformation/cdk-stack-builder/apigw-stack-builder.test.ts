import * as cdk from '@aws-cdk/core';
import { Template } from '@aws-cdk/assertions';
import { AmplifyApigwResourceStack } from '../../../../provider-utils/awscloudformation/cdk-stack-builder/apigw-stack-builder';
import { PermissionSetting } from '../../../../provider-utils/awscloudformation/cdk-stack-builder/types';

describe('AmplifyApigwResourceStack', () => {
  test('generateStackResources should synthesize the way we expected', () => {
    const app = new cdk.App();
    const amplifyApigwStack = new AmplifyApigwResourceStack(app, 'amplifyapigwstack', {
      version: 1,
      paths: {
        '/path': {
          lambdaFunction: 'lambdaFunction',
          permissions: {
            setting: PermissionSetting.OPEN,
          },
        },
      },
    });
    amplifyApigwStack.generateStackResources('myapi');
    const template = Template.fromStack(amplifyApigwStack);
    console.log(template.toJSON());
    template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
      ResponseType: 'DEFAULT_4XX',
      ResponseParameters: {
        'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
        'gatewayresponse.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        'gatewayresponse.header.Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
        'gatewayresponse.header.Access-Control-Expose-Headers': "'Date,X-Amzn-ErrorType'",
      },
      RestApiId: {
        Ref: 'myapi',
      },
    });
    template.hasResourceProperties('AWS::ApiGateway::GatewayResponse', {
      ResponseType: 'DEFAULT_5XX',
      ResponseParameters: {
        'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
        'gatewayresponse.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        'gatewayresponse.header.Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
        'gatewayresponse.header.Access-Control-Expose-Headers': "'Date,X-Amzn-ErrorType'",
      },
      RestApiId: {
        Ref: 'myapi',
      },
    });
  });
});
