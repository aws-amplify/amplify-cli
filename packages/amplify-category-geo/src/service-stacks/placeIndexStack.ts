import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { CfnResource, Fn } from '@aws-cdk/core';
import { PlaceIndexParameters } from '../service-utils/placeIndexParams';
import { AccessType } from '../service-utils/resourceParams';
import { BaseStack, TemplateMappings } from './baseStack';

type PlaceIndexStackProps = Pick<PlaceIndexParameters, 'accessType'> & TemplateMappings;

export class PlaceIndexStack extends BaseStack {
  protected readonly accessType: string;
  protected readonly placeIndexResource: cdk.CustomResource;
  protected readonly placeIndexRegion: string
  protected readonly placeIndexName: string

  constructor(scope: cdk.Construct, id: string, private readonly props: PlaceIndexStackProps) {
    super(scope, id, props);

    this.accessType = this.props.accessType;
    this.placeIndexRegion = this.regionMapping.findInMap(cdk.Fn.ref('AWS::Region'), 'locationServiceRegion');

    this.parameters = this.constructInputParameters([
      'authRoleName',
      'unauthRoleName',
      'indexName',
      'dataProvider',
      'dataSourceIntendedUse',
      'pricingPlan',
      'env',
      'isDefault'
    ]);

    this.placeIndexName = Fn.join('-', [
      this.parameters.get('indexName')!.valueAsString,
      this.parameters.get('env')!.valueAsString
    ]);

    this.placeIndexResource = this.constructIndexResource();
    this.constructIndexPolicyResource(this.placeIndexResource);
    this.constructOutputs();
  }

  private constructOutputs() {
    new cdk.CfnOutput(this, 'Name', {
        value: this.placeIndexResource.getAtt('IndexName').toString()
    });
    new cdk.CfnOutput(this, 'Region', {
        value: this.placeIndexRegion
    });
  }

  private constructIndexResource(): cdk.CustomResource {
    const lambdaExecutionRole = new iam.CfnRole(this, 'CustomPlaceIndexLambdaExecutionRole', {
      roleName: `${this.placeIndexName}LambdaRole`,
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: ['lambda.amazonaws.com'],
            },
            Action: ['sts:AssumeRole'],
          },
        ],
      },
      policies: [
        {
          policyName: `${this.placeIndexName}CustomLambdaLogPolicy`,
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                Resource: 'arn:aws:logs:*:*:*',
              },
            ],
          },
        },
        {
          policyName: `${this.placeIndexName}CustomLambdaGeoPolicy`,
          policyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'geo:CreatePlaceIndex',
                  'geo:UpdatePlaceIndex',
                  'geo:DeletePlaceIndex'
                ],
                Resource: '*',
              },
            ],
          },
        }
      ],
    });

  const dataSource = this.parameters.get('dataProvider')!.valueAsString;

  const dataSourceIntendedUse = this.parameters.get('dataSourceIntendedUse')!.valueAsString;

  const indexPricingPlan = this.parameters.get('pricingPlan')!.valueAsString;

  const customPlaceIndexLambda = new lambda.CfnFunction(this, 'CustomPlaceIndexLambda', {
    code: {
    zipFile: cdk.Fn.join('\n', [
        "const response = require('cfn-response');",
        "const aws = require('aws-sdk');",
        "exports.handler = (event, context) => {",
        " try {",
        "  console.log('REQUEST RECEIVED:' + JSON.stringify(event));",
        "  if (event.RequestType == 'Create') {",
        "    let params = {",
        "      IndexName: event.ResourceProperties.indexName,",
        "      DataSource: event.ResourceProperties.dataSource,",
        "      PricingPlan: event.ResourceProperties.pricingPlan,",
        "      DataSourceConfiguration: {",
        "        IntendedUse: event.ResourceProperties.dataSourceIntendedUse",
        "      }",
        "    };",
        "    const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });",
        "    locationClient.createPlaceIndex(params).promise()",
        "    .then((res) => {",
        "       console.log(\"create\" + res);",
        "       console.log(\"response data\" + JSON.stringify(res));",
        "       if (res.IndexName && res.IndexArn) {",
        "         event.PhysicalResourceId = event.ResourceProperties.indexName;",
        "         response.send(event, context, response.SUCCESS, res);",
        "       }",
        "       else {",
        "         response.send(event, context, response.FAILED, res);",
        "       }",
        "     });",
        "  }",
        "  if (event.RequestType == 'Update') {",
        "    let params = {",
        "      IndexName: event.ResourceProperties.indexName,",
        "      PricingPlan: event.ResourceProperties.pricingPlan,",
        "      DataSourceConfiguration: {",
        "        IntendedUse: event.ResourceProperties.dataSourceIntendedUse",
        "      }",
        "    };",
        "    const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });",
        "    locationClient.updatePlaceIndex(params).promise()",
        "    .then((res) => {",
        "       console.log(\"update\" + res);",
        "       console.log(\"response data\" + JSON.stringify(res));",
        "       if (res.IndexName && res.IndexArn) {",
        "         event.PhysicalResourceId = event.ResourceProperties.indexName;",
        "         response.send(event, context, response.SUCCESS, res);",
        "       }",
        "       else {",
        "         response.send(event, context, response.FAILED, res);",
        "       }",
        "     });",
        "  }",
        "  if (event.RequestType == 'Delete') {",
        "    let params = {",
        "      IndexName: event.ResourceProperties.indexName",
        "    };",
        "    const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });",
        "    locationClient.deletePlaceIndex(params).promise()",
        "    .then((res) => {",
        "       event.PhysicalResourceId = event.ResourceProperties.indexName;",
        "       console.log(\"delete\" + res);",
        "       console.log(\"response data\" + JSON.stringify(res));",
        "       response.send(event, context, response.SUCCESS, res);",
        "     });",
        "  }",
        " } catch(err) {",
        "  console.log(err.stack);",
        "  const res = {Error: err};",
        "  response.send(event, context, response.FAILED, res);",
        "  throw err;",
        " }",
        "};"
    ]),
    },
    handler: 'index.handler',
    runtime: 'nodejs12.x',
    timeout: 300,
    role: lambdaExecutionRole.attrArn
  });

  const placeIndexCustomResource = new cdk.CustomResource(this, 'CustomPlaceIndex', {
    serviceToken: customPlaceIndexLambda.attrArn,
    resourceType: 'Custom::LambdaCallout',
    properties: {
      indexName: this.placeIndexName,
      dataSource: dataSource,
      dataSourceIntendedUse: dataSourceIntendedUse,
      pricingPlan: indexPricingPlan,
      region: this.placeIndexRegion,
      env: cdk.Fn.ref('env'),
    },
  });

  return placeIndexCustomResource;
}

  // Grant read-only access to the Place Index for Authorized and/or Guest users
  private constructIndexPolicyResource(indexResource: cdk.CustomResource): CfnResource {
    let policy = new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "geo:SearchPlaceIndexForPosition",
                "geo:SearchPlaceIndexForText"
            ],
            resources: [indexResource.getAtt('IndexArn').toString()],
          })
        ],
    });

    let cognitoRoles: Array<string> = new Array();
    cognitoRoles.push(this.parameters.get('authRoleName')!.valueAsString);
    if (this.accessType == AccessType.AuthorizedAndGuestUsers) {
        cognitoRoles.push(this.parameters.get('unauthRoleName')!.valueAsString);
    }

    return new iam.CfnPolicy(this, 'PlaceIndexPolicy', {
        policyName: `${this.placeIndexName}Policy`,
        roles: cognitoRoles,
        policyDocument: policy
    });
  }
}
