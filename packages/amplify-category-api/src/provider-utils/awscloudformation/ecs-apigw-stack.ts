import * as apigw2 from '@aws-cdk/aws-apigatewayv2';
import * as cdk from '@aws-cdk/core';
import { ContainersStack, ContainersStackProps } from './base-api-stack';
import { API_TYPE } from './service-walkthroughs/containers-walkthrough';

type EcsStackProps = Readonly<
  ContainersStackProps & {
    apiType: API_TYPE;
  }
>;
export class EcsStack extends ContainersStack {
  constructor(scope: cdk.Construct, id: string, private readonly ecsProps: EcsStackProps) {
    super(scope, id, {
      ...ecsProps,
      createCloudMapService: true,
    });

    const { apiType } = this.ecsProps;

    const { api } = this.apiGateway();

    switch (apiType) {
      case API_TYPE.GRAPHQL:
        new cdk.CfnOutput(this, 'GraphQLAPIEndpointOutput', { value: api.attrApiEndpoint });
        break;
      case API_TYPE.REST:
        new cdk.CfnOutput(this, 'ApiName', { value: ecsProps.apiName });
        new cdk.CfnOutput(this, 'RootUrl', { value: api.attrApiEndpoint });
        break;
      default:
        const invalidApiType: never = apiType;
        throw new Error(`Invalid api type ${invalidApiType}`);
    }
  }

  private apiGateway() {
    const { apiName } = this.ecsProps;

    const api = new apigw2.CfnApi(this, 'Api', {
      name: `${this.envName}-${apiName}`,
      protocolType: 'HTTP',
      corsConfiguration: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: Object.values(apigw2.HttpMethod).filter(m => m !== apigw2.HttpMethod.ANY),
      },
    });

    new apigw2.CfnStage(this, 'Stage', {
      apiId: cdk.Fn.ref(api.logicalId),
      stageName: '$default',
      autoDeploy: true,
    });

    const integration = new apigw2.CfnIntegration(this, 'ANYIntegration', {
      apiId: cdk.Fn.ref(api.logicalId),
      integrationType: apigw2.HttpIntegrationType.HTTP_PROXY,
      connectionId: this.vpcLinkId,
      connectionType: apigw2.HttpConnectionType.VPC_LINK,
      integrationMethod: 'ANY',
      integrationUri: this.cloudMapService.attrArn,
      payloadFormatVersion: '1.0',
    });

    const authorizer = new apigw2.CfnAuthorizer(this, 'Authorizer', {
      name: `${apiName}Authorizer`,
      apiId: cdk.Fn.ref(api.logicalId),
      authorizerType: 'JWT',
      jwtConfiguration: {
        audience: [this.appClientId],
        issuer: cdk.Fn.join('', ['https://cognito-idp.', cdk.Aws.REGION, '.amazonaws.com/', this.userPoolId]),
      },
      identitySource: ['$request.header.Authorization'],
    });

    authorizer.cfnOptions.condition = this.isAuthCondition;

    new apigw2.CfnRoute(this, 'DefaultRoute', {
      apiId: cdk.Fn.ref(api.logicalId),
      routeKey: '$default',
      target: cdk.Fn.join('', ['integrations/', cdk.Fn.ref(integration.logicalId)]),
      authorizationScopes: [],
      authorizationType: <any>cdk.Fn.conditionIf(this.isAuthCondition.logicalId, 'JWT', 'NONE'),
      authorizerId: <any>cdk.Fn.conditionIf(this.isAuthCondition.logicalId, cdk.Fn.ref(authorizer.logicalId), ''),
    });

    new apigw2.CfnRoute(this, 'OptionsRoute', {
      apiId: cdk.Fn.ref(api.logicalId),
      routeKey: 'OPTIONS /{proxy+}',
      target: cdk.Fn.join('', ['integrations/', cdk.Fn.ref(integration.logicalId)]),
    });

    return {
      api,
    };
  }
}
