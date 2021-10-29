import { $TSObject, JSONUtilities } from 'amplify-cli-core';
import * as cdk from '@aws-cdk/core';
import * as apigw from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import { AmplifyApigwResourceTemplate, ApigwInputs, ApigwPathPolicy } from './types';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'API Gateway Resource for AWS Amplify CLI';

export class AmplifyApigwResourceStack extends cdk.Stack implements AmplifyApigwResourceTemplate {
  _scope: cdk.Construct;
  restApi!: apigw.CfnRestApi;
  _deploymentResource: apigw.CfnDeployment;
  _lambdaPermission: lambda.CfnPermission;
  _props: ApigwInputs;
  _cfnPaths: $TSObject;
  _policies: { [pathName: string]: ApigwPathPolicy };
  _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();

  constructor(scope: cdk.Construct, id: string, props: ApigwInputs) {
    super(scope, id, undefined);
    this._scope = scope;
    this._props = props;
    this._cfnPaths = {};
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
    this.templateOptions.description = ROOT_CFN_DESCRIPTION;
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    new cdk.CfnOutput(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    new cdk.CfnMapping(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    new cdk.CfnCondition(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void {
    new cdk.CfnResource(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addLambdaPermissionCfnResource(props: lambda.CfnPermissionProps, logicalId: string): void {
    new lambda.CfnPermission(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string): void {
    if (this._cfnParameterMap.has(logicalId)) {
      throw new Error('logical id already exists');
    }
    this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
  }

  private _constructCfnPaths(resourceName: string) {
    for (const path of this._props.paths) {
      this._cfnPaths[path.name] = {
        options: {
          consumes: ['application/json'],
          produces: ['application/json'],
          responses: {
            '200': response200,
          },
          'x-amazon-apigateway-integration': {
            responses: {
              default: defaultResponseObject,
            },
            requestTemplates: {
              'application/json': '{"statusCode": 200}',
            },
            passthroughBehavior: 'when_no_match',
            type: 'mock',
          },
        },
        'x-amazon-apigateway-any-method': {
          consumes: ['application/json'],
          produces: ['application/json'],
          parameters: [
            {
              in: 'body',
              name: 'RequestSchema',
              required: false,
              schema: {
                $ref: '#/definitions/RequestSchema',
              },
            },
          ],
          responses: {
            '200': {
              description: '200 response',
              schema: {
                $ref: '#/definitions/ResponseSchema',
              },
            },
          },
          'x-amazon-apigateway-integration': {
            responses: {
              default: {
                statusCode: '200',
              },
            },
            uri: cdk.Fn.join('', [
              'arn:aws:apigateway:',
              cdk.Fn.ref('AWS::Region'),
              ':lambda:path/2015-03-31/functions/',
              cdk.Fn.ref(`function${path.lambdaFunction}Arn`),
              '/invocations',
            ]),
            passthroughBehavior: 'when_no_match',
            httpMethod: 'POST',
            type: 'aws_proxy',
          },
        },
      };

      this._cfnPaths[`${path.name}/{proxy+}`] = {
        options: {
          consumes: ['application/json'],
          produces: ['application/json'],
          responses: {
            '200': response200,
          },
          'x-amazon-apigateway-integration': {
            responses: {
              default: defaultResponseObject,
            },
            requestTemplates: {
              'application/json': '{"statusCode": 200}',
            },
            passthroughBehavior: 'when_no_match',
            type: 'mock',
          },
        },
        'x-amazon-apigateway-any-method': {
          consumes: ['application/json'],
          produces: ['application/json'],
          parameters: [
            {
              in: 'body',
              name: 'RequestSchema',
              required: false,
              schema: {
                $ref: '#/definitions/RequestSchema',
              },
            },
          ],
          responses: {
            '200': {
              description: '200 response',
              schema: {
                $ref: '#/definitions/ResponseSchema',
              },
            },
          },
          'x-amazon-apigateway-integration': {
            responses: {
              default: {
                statusCode: '200',
              },
            },
            uri: cdk.Fn.join('', [
              'arn:aws:apigateway:',
              cdk.Fn.ref('AWS::Region'),
              ':lambda:path/2015-03-31/functions/',
              cdk.Fn.ref(`function${path.lambdaFunction}Arn`),
              '/invocations',
            ]),
            passthroughBehavior: 'when_no_match',
            httpMethod: 'POST',
            type: 'aws_proxy',
          },
        },
      };

      this.addLambdaPermissionCfnResource(
        {
          functionName: cdk.Fn.ref(`function${path.lambdaFunction}Name`),
          action: 'lambda:InvokeFunction',
          principal: 'apigateway.amazonaws.com',
          sourceArn: cdk.Fn.join('', [
            'arn:aws:execute-api:',
            cdk.Fn.ref('AWS::Region'),
            ':',
            cdk.Fn.ref('AWS::AccountId'),
            ':',
            cdk.Fn.ref(resourceName),
            '/*/*/*',
          ]),
        },
        `function${path.lambdaFunction}Permission${resourceName}`,
      );
    }
  }

  generateStackResources = (resourceName: string) => {
    this._constructCfnPaths(resourceName);

    this.restApi = new apigw.CfnRestApi(this, resourceName, {
      description: '', // TODO - left blank in current CLI
      failOnWarnings: true,
      name: resourceName,
      body: {
        swagger: '2.0',
        info: {
          version: '2018-05-24T17:52:00Z',
          title: resourceName,
        },
        host: cdk.Fn.join('', ['apigateway.', cdk.Fn.ref('AWS::Region'), '.amazonaws.com']),
        basePath: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', '/Prod', cdk.Fn.join('', ['/', cdk.Fn.ref('env')])),
        schemes: ['https'],
        paths: this._cfnPaths,
        securityDefinitions: {
          sigv4: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            'x-amazon-apigateway-authtype': 'awsSigv4',
          },
        },
        definitions: {
          RequestSchema: {
            type: 'object',
            required: ['request'],
            properties: {
              request: {
                type: 'string',
              },
            },
            title: 'Request Schema',
          },
          ResponseSchema: {
            type: 'object',
            required: ['response'],
            properties: {
              response: {
                type: 'string',
              },
            },
            title: 'Response Schema',
          },
        },
      },
    });

    this._deploymentResource = new apigw.CfnDeployment(this, `DeploymentAPIGW${resourceName}`, {
      restApiId: cdk.Fn.ref(resourceName),
      stageName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', 'Prod', cdk.Fn.ref('env')).toString(),
    });
  };

  public renderCloudFormationTemplate = (): string => {
    return JSONUtilities.stringify(this._toCloudFormation());
  };
}

const defaultResponseObject = {
  statusCode: '200',
  responseParameters: {
    'method.response.header.Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
    'method.response.header.Access-Control-Allow-Headers':
      "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
    'method.response.header.Access-Control-Allow-Origin': "'*'",
  },
};

const response200 = {
  description: '200 response',
  headers: {
    'Access-Control-Allow-Origin': {
      type: 'string',
    },
    'Access-Control-Allow-Methods': {
      type: 'string',
    },
    'Access-Control-Allow-Headers': {
      type: 'string',
    },
  },
};
