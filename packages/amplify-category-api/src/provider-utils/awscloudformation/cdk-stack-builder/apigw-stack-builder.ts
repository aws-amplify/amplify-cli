import * as apigw from '@aws-cdk/aws-apigateway';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { $TSObject, JSONUtilities } from 'amplify-cli-core';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { ADMIN_QUERIES_NAME } from '../../../category-constants';
import { AmplifyApigwResourceTemplate, ApigwInputs, ApigwPathPolicy, Path, PermissionSetting } from './types';

const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'API Gateway Resource for AWS Amplify CLI';

export class AmplifyApigwResourceStack extends cdk.Stack implements AmplifyApigwResourceTemplate {
  restApi: apigw.CfnRestApi;
  deploymentResource: apigw.CfnDeployment;
  paths: $TSObject;
  policies: { [pathName: string]: ApigwPathPolicy };
  private _scope: cdk.Construct;
  private _props: ApigwInputs;
  private _cfnParameterMap: Map<string, cdk.CfnParameter> = new Map();
  private _cfnParameterValues: $TSObject;
  private _seenLogicalIds: Set<string>;

  constructor(scope: cdk.Construct, id: string, props: ApigwInputs) {
    super(scope, id, undefined);
    this._scope = scope;
    this._props = props;
    this.paths = {};
    this._seenLogicalIds = new Set();
    this._cfnParameterValues = {};
    this.policies = {};
    this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
    this.templateOptions.description = ROOT_CFN_DESCRIPTION;
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void {
    this.validateLogicalId(logicalId);
    new cdk.CfnOutput(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void {
    this.validateLogicalId(logicalId);
    new cdk.CfnMapping(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void {
    this.validateLogicalId(logicalId);
    new cdk.CfnCondition(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void {
    this.validateLogicalId(logicalId);
    new cdk.CfnResource(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   */
  addCfnLambdaPermissionResource(props: lambda.CfnPermissionProps, logicalId: string): void {
    this.validateLogicalId(logicalId);
    new lambda.CfnPermission(this, logicalId, props);
  }

  /**
   *
   * @param props
   * @param logicalId
   * @param value optional value which will be stored in parameters.json
   */
  addCfnParameter(props: cdk.CfnParameterProps, logicalId: string, value?: string | $TSObject): void {
    this.validateLogicalId(logicalId);
    this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
    if (value !== undefined) {
      this._cfnParameterValues[logicalId] = value;
    }
  }

  getCfnParameterValues() {
    return this._cfnParameterValues;
  }

  private validateLogicalId(logicalId: string): void {
    if (this._seenLogicalIds.has(logicalId)) {
      throw new Error(`logical id "${logicalId}" already exists`);
    }
    this._seenLogicalIds.add(logicalId);
  }

  private _craftPolicyDocument(apiResourceName: string, pathName: string, supportedOperations: string[]) {
    const resources = [pathName, `${pathName}/*`].flatMap(path =>
      supportedOperations.map(op =>
        cdk.Fn.join('', [
          'arn:aws:execute-api:',
          cdk.Fn.ref('AWS::Region'),
          ':',
          cdk.Fn.ref('AWS::AccountId'),
          ':',
          cdk.Fn.ref(apiResourceName),
          '/',
          cdk.Fn.conditionIf('ShouldNotCreateEnvResources', 'Prod', cdk.Fn.ref('env')).toString(),
          op,
          path,
        ]),
      ),
    );

    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['execute-api:Invoke'],
          effect: iam.Effect.ALLOW,
          resources,
        }),
      ],
    });
  }

  addIamPolicyResourceForUserPoolGroup(
    apiResourceName: string,
    authRoleLogicalId: string,
    groupName: string,
    pathName: string,
    supportedOperations: string[],
  ): void {
    const alphanumericPathName = pathName.replace(/[^-a-z0-9]/g, '');

    const policyName = [apiResourceName, alphanumericPathName, groupName, 'group', 'policy'].join('-');

    const iamPolicy = new iam.CfnPolicy(this, `${groupName}Group${alphanumericPathName}Policy`, {
      policyDocument: this._craftPolicyDocument(apiResourceName, pathName, supportedOperations),
      policyName,
      roles: [cdk.Fn.join('-', [cdk.Fn.ref(authRoleLogicalId), `${groupName}GroupRole`])],
    });
    _.set(this.policies, [pathName, 'groups', groupName], iamPolicy);
  }

  renderCloudFormationTemplate = (): string => {
    return JSONUtilities.stringify(this._toCloudFormation());
  };

  generateAdminQueriesStack = (resourceName: string, authResourceName: string) => {
    this._constructCfnPaths(resourceName);

    this.restApi = new apigw.CfnRestApi(this, resourceName, {
      description: '',
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
        paths: this.paths,
        securityDefinitions: {
          Cognito: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
            'x-amazon-apigateway-authtype': 'cognito_user_pools',
            'x-amazon-apigateway-authorizer': {
              providerARNs: [
                cdk.Fn.join('', [
                  'arn:aws:cognito-idp:',
                  cdk.Fn.ref('AWS::Region'),
                  ':',
                  cdk.Fn.ref('AWS::AccountId'),
                  ':userpool/',
                  cdk.Fn.ref(`auth${authResourceName}UserPoolId`),
                ]),
              ],
              type: 'cognito_user_pools',
            },
          },
        },
        definitions: {
          Empty: {
            type: 'object',
            title: 'Empty Schema',
          },
        },
        'x-amazon-apigateway-request-validators': {
          'Validate query string parameters and headers': {
            validateRequestParameters: true,
            validateRequestBody: false,
          },
        },
      },
    });

    this._setDeploymentResource(resourceName);
  };

  generateStackResources = (resourceName: string) => {
    this._constructCfnPaths(resourceName);

    this.restApi = new apigw.CfnRestApi(this, resourceName, {
      description: '',
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
        paths: this.paths,
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
    new apigw.CfnGatewayResponse(this, `${resourceName}Default4XXResponse`, {
      responseType: 'DEFAULT_4XX',
      restApiId: cdk.Fn.ref(resourceName),
      responseParameters: defaultCorsGatewayResponseParams,
    });
    new apigw.CfnGatewayResponse(this, `${resourceName}Default5XXResponse`, {
      responseType: 'DEFAULT_5XX',
      restApiId: cdk.Fn.ref(resourceName),
      responseParameters: defaultCorsGatewayResponseParams,
    });

    this._setDeploymentResource(resourceName);
  };

  private _constructCfnPaths(resourceName: string) {
    const addedFunctionPermissions = new Set();
    for (const [pathName, path] of Object.entries(this._props.paths)) {
      let lambdaPermissionLogicalId: string;
      if (resourceName === ADMIN_QUERIES_NAME) {
        this.paths[`/{proxy+}`] = getAdminQueriesPathObject(path.lambdaFunction);
        lambdaPermissionLogicalId = `${ADMIN_QUERIES_NAME}APIGWPolicyForLambda`;
      } else {
        this.paths[pathName] = createPathObject(path);
        this.paths[`${pathName}/{proxy+}`] = createPathObject(path);
        lambdaPermissionLogicalId = `function${path.lambdaFunction}Permission${resourceName}`;
      }

      if (!addedFunctionPermissions.has(path.lambdaFunction)) {
        addedFunctionPermissions.add(path.lambdaFunction);
        this.addCfnLambdaPermissionResource(
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
          lambdaPermissionLogicalId,
        );
      }
    }
  }

  private _setDeploymentResource = (resourceName: string) => {
    const [shortId] = uuid().split('-');
    this.deploymentResource = new apigw.CfnDeployment(this, `DeploymentAPIGW${resourceName}${shortId}`, {
      description: 'The Development stage deployment of your API.',
      stageName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', 'Prod', cdk.Fn.ref('env')).toString(),
      restApiId: cdk.Fn.ref(resourceName),
    });
  };
}

const getAdminQueriesPathObject = (lambdaFunctionName: string) => ({
  options: {
    consumes: ['application/json'],
    produces: ['application/json'],
    responses: {
      '200': {
        description: '200 response',
        schema: {
          $ref: '#/definitions/Empty',
        },
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
      },
    },
    'x-amazon-apigateway-integration': {
      responses: {
        default: {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
          },
        },
      },
      passthroughBehavior: 'when_no_match',
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
      type: 'mock',
    },
  },
  'x-amazon-apigateway-any-method': {
    produces: ['application/json'],
    parameters: [
      {
        name: 'proxy',
        in: 'path',
        required: true,
        type: 'string',
      },
      {
        name: 'Authorization',
        in: 'header',
        required: false,
        type: 'string',
      },
    ],
    responses: {},
    security: [
      {
        Cognito: ['aws.cognito.signin.user.admin'],
      },
    ],
    'x-amazon-apigateway-request-validator': 'Validate query string parameters and headers',
    'x-amazon-apigateway-integration': {
      uri: cdk.Fn.join('', [
        'arn:aws:apigateway:',
        cdk.Fn.ref('AWS::Region'),
        ':lambda:path/2015-03-31/functions/',
        cdk.Fn.ref(`function${lambdaFunctionName}Arn`),
        '/invocations',
      ]),
      passthroughBehavior: 'when_no_match',
      httpMethod: 'POST',
      cacheNamespace: 'n40eb9',
      cacheKeyParameters: ['method.request.path.proxy'],
      contentHandling: 'CONVERT_TO_TEXT',
      type: 'aws_proxy',
    },
  },
});

const createPathObject = (path: Path) => {
  const defaultPathObject: $TSObject = {
    options: {
      consumes: ['application/json'],
      produces: ['application/json'],
      responses: {
        '200': response200,
      },
      'x-amazon-apigateway-integration': {
        responses: {
          default: defaultCorsResponseObject,
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

  if (path.permissions.setting !== PermissionSetting.OPEN) {
    defaultPathObject['x-amazon-apigateway-any-method'].security = [
      {
        sigv4: [],
      },
    ];
  }

  return defaultPathObject;
};

const defaultCorsResponseObject = {
  statusCode: '200',
  responseParameters: {
    'method.response.header.Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
    'method.response.header.Access-Control-Allow-Headers':
      "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
    'method.response.header.Access-Control-Allow-Origin': "'*'",
  },
};

const defaultCorsGatewayResponseParams = {
  'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
  'gatewayresponse.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
  'gatewayresponse.header.Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
  'gatewayresponse.header.Access-Control-Expose-Headers': "'Date,X-Amzn-ErrorType'",
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
