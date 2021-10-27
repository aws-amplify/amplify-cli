import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { MapParameters } from '../service-utils/mapParams';
import { CfnResource, Duration, Fn } from '@aws-cdk/core';
import { AccessType } from '../service-utils/resourceParams';
import { BaseStack, TemplateMappings } from './baseStack';
import { Effect } from '@aws-cdk/aws-iam';
import { Runtime } from '@aws-cdk/aws-lambda';
import { customMapLambdaCodePath } from '../service-utils/constants';
import * as fs from 'fs-extra';

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
        new cdk.CfnOutput(this, 'Arn', {
          value: this.mapResource.getAtt('MapArn').toString()
        });
    }

    private constructMapResource(): cdk.CustomResource {
        const geoCreateMapStatement = new iam.PolicyStatement({
          effect: Effect.ALLOW
        });
        geoCreateMapStatement.addActions('geo:CreateMap');
        geoCreateMapStatement.addAllResources();

        const mapARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:map/${mapName}', {
          region: this.mapRegion,
          account: cdk.Fn.ref('AWS::AccountId'),
          mapName: this.mapName
        });

        const geoUpdateDeleteMapStatement = new iam.PolicyStatement({
          effect: Effect.ALLOW
        });
        geoUpdateDeleteMapStatement.addActions('geo:UpdateMap', 'geo:DeleteMap');
        geoUpdateDeleteMapStatement.addResources(mapARN);

        const mapStyle = this.parameters.get('mapStyle')!.valueAsString;

        const mapPricingPlan = this.parameters.get('pricingPlan')!.valueAsString;

        const customMapLambdaCode = fs.readFileSync(customMapLambdaCodePath, 'utf-8');
        const customMapLambda = new lambda.Function(this, 'CustomMapLambda', {
          code: lambda.Code.fromInline(customMapLambdaCode),
          handler: 'index.handler',
          runtime: Runtime.NODEJS_14_X,
          timeout: Duration.seconds(300)
        });
        customMapLambda.addToRolePolicy(geoCreateMapStatement);
        customMapLambda.addToRolePolicy(geoUpdateDeleteMapStatement);

        const mapCustomResource = new cdk.CustomResource(this, 'CustomMap', {
            serviceToken: customMapLambda.functionArn,
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
