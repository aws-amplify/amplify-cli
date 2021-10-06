import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { MapParameters } from '../service-utils/mapParams';
import { CfnResource, Fn } from '@aws-cdk/core';
import { AccessType } from '../service-utils/resourceParams';
import { BaseStack, TemplateMappings } from './baseStack';

type MapStackProps = Pick<MapParameters, 'accessType'> & TemplateMappings;

export class MapStack extends BaseStack {
    protected readonly accessType: string;
    protected readonly mapResource: cdk.CustomResource;
    protected readonly mapRegion: string
    protected readonly mapName: string

    constructor(scope: cdk.Construct, id: string, private readonly props: MapStackProps) {
        super(scope, id, props);

        this.accessType = this.props.accessType;
        this.mapRegion = this.regionMapping.findInMap(cdk.Fn.ref('AWS::Region'), 'locationServiceRegion');

        this.parameters = this.constructInputParameters([
            'authRoleName',
            'unauthRoleName',
            'mapName',
            'mapStyle',
            'pricingPlan',
            'env',
            'isDefault'
        ]);

        this.mapName = Fn.join('-', [
            this.parameters.get('mapName')!.valueAsString,
            this.parameters.get('env')!.valueAsString
        ]);
        this.mapResource = this.constructMapResource();
        this.constructMapPolicyResource(this.mapResource);
        this.constructOutputs();
    }

    private constructOutputs() {
        new cdk.CfnOutput(this, 'Name', {
            value: this.mapResource.getAtt('MapName').toString()
        });
        new cdk.CfnOutput(this, 'Style', {
            value: this.parameters.get('mapStyle')!.valueAsString
        });
        new cdk.CfnOutput(this, 'Region', {
            value: this.mapRegion
        });
    }

    private constructMapResource(): cdk.CustomResource {
        const lambdaExecutionRole = new iam.CfnRole(this, 'CustomMapLambdaExecutionRole', {
            roleName: `${this.mapName}LambdaRole`,
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
                policyName: `${this.mapName}CustomLambdaLogPolicy`,
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
                policyName: `${this.mapName}CustomLambdaGeoPolicy`,
                policyDocument: {
                  Version: '2012-10-17',
                  Statement: [
                    {
                      Effect: 'Allow',
                      Action: [
                        'geo:CreateMap',
                        'geo:UpdateMap',
                        'geo:DeleteMap'
                      ],
                      Resource: '*',
                    },
                  ],
                },
              }
            ],
        });

        const mapStyle = this.parameters.get('mapStyle')!.valueAsString;

        const mapPricingPlan = this.parameters.get('pricingPlan')!.valueAsString;

        const customMapLambda = new lambda.CfnFunction(this, 'CustomMapLambda', {
            code: {
            zipFile: cdk.Fn.join('\n', [
                "const response = require('cfn-response');",
                "const aws = require('aws-sdk');",
                "exports.handler = (event, context) => {",
                " try {",
                "  console.log('REQUEST RECEIVED:' + JSON.stringify(event));",
                "  if (event.RequestType == 'Create') {",
                "    let params = {",
                "      MapName: event.ResourceProperties.mapName,",
                "      Configuration: {",
                "        Style: event.ResourceProperties.mapStyle",
                "      },",
                "      PricingPlan: event.ResourceProperties.pricingPlan",
                "    };",
                "    const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });",
                "    locationClient.createMap(params).promise()",
                "    .then((res) => {",
                "       console.log(\"create\" + res);",
                "       console.log(\"response data\" + JSON.stringify(res));",
                "       if (res.MapName && res.MapArn) {",
                "         event.PhysicalResourceId = event.ResourceProperties.mapName;",
                "         response.send(event, context, response.SUCCESS, res);",
                "       }",
                "       else {",
                "         response.send(event, context, response.FAILED, res);",
                "       }",
                "     });",
                "  }",
                "  if (event.RequestType == 'Update') {",
                "    let params = {",
                "      MapName: event.ResourceProperties.mapName,",
                "      PricingPlan: event.ResourceProperties.pricingPlan",
                "    };",
                "    const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });",
                "    locationClient.updateMap(params).promise()",
                "    .then((res) => {",
                "       console.log(\"update\" + res);",
                "       console.log(\"response data\" + JSON.stringify(res));",
                "       if (res.MapName && res.MapArn) {",
                "         event.PhysicalResourceId = event.ResourceProperties.mapName;",
                "         response.send(event, context, response.SUCCESS, res);",
                "       }",
                "       else {",
                "         response.send(event, context, response.FAILED, res);",
                "       }",
                "     });",
                "  }",
                "  if (event.RequestType == 'Delete') {",
                "    let params = {",
                "      MapName: event.ResourceProperties.mapName",
                "    };",
                "    const locationClient = new aws.Location({ apiVersion: '2020-11-19', region: event.ResourceProperties.region });",
                "    locationClient.deleteMap(params).promise()",
                "    .then((res) => {",
                "       event.PhysicalResourceId = event.ResourceProperties.mapName;",
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

        const mapCustomResource = new cdk.CustomResource(this, 'CustomMap', {
            serviceToken: customMapLambda.attrArn,
            resourceType: 'Custom::LambdaCallout',
            properties: {
                mapName: this.mapName,
                mapStyle: mapStyle,
                pricingPlan: mapPricingPlan,
                region: this.mapRegion,
                env: cdk.Fn.ref('env'),
            },
        });

        return mapCustomResource;
    }

    // Grant read-only access to the Map for Authorized and/or Guest users
    private constructMapPolicyResource(mapResource: cdk.CustomResource): CfnResource {
        let policy = new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "geo:GetMapStyleDescriptor",
                    "geo:GetMapGlyphs",
                    "geo:GetMapSprites",
                    "geo:GetMapTile"
                ],
                resources: [mapResource.getAtt('MapArn').toString()],
              })
            ],
        });

        let cognitoRoles: Array<string> = new Array();
        cognitoRoles.push(this.parameters.get('authRoleName')!.valueAsString);
        if (this.accessType == AccessType.AuthorizedAndGuestUsers) {
            cognitoRoles.push(this.parameters.get('unauthRoleName')!.valueAsString);
        }

        return new iam.CfnPolicy(this, 'MapPolicy', {
            policyName: `${this.mapName}Policy`,
            roles: cognitoRoles,
            policyDocument: policy
        });
    }
}
