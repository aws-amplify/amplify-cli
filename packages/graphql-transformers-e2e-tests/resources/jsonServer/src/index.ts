import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';

export class JsonMockStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const jsonLambda = new lambda.Function(this, 'jsonServerFunction', {
      code: new lambda.AssetCode('src-server'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_10_X
    });

    const api = new apigateway.LambdaRestApi(this, 'jsonMockApi', {
      handler: jsonLambda
    });
  }
}

const app = new cdk.App();

new JsonMockStack(app, 'JsonMockStack');

app.synth();
