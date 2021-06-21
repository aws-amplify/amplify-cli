import * as cdk from '@aws-cdk/core';
import * as location from '@aws-cdk/aws-location';
import * as iam from '@aws-cdk/aws-iam';
import { MapParameters, getGeoMapStyle } from '../utils/mapParams';
import { CfnResource } from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import { AccessType } from '../utils/resourceParams';

export class MapStack extends cdk.Stack {
    protected readonly parameters: ReadonlyMap<string, cdk.CfnParameter>;
    protected readonly resources: ReadonlyMap<string, cdk.CfnResource>;
    protected readonly mapName: string;
    protected readonly mapStyle: string;
    protected readonly pricingPlan: string;
    protected readonly accessType: string;

    constructor(scope: cdk.Construct, id: string, private readonly props: MapParameters) {
        super(scope, id);

        this.mapName = this.props.mapName;
        this.mapStyle = getGeoMapStyle(this.props.dataProvider, this.props.mapStyleType);
        this.pricingPlan = this.props.pricingPlan;
        this.accessType = this.props.accessType;

        this.parameters = this.constructInputParameters([
            'authRoleName',
            'unauthRoleName',
            'env'
        ]);

        this.resources = this.constructResources();

        new cdk.CfnOutput(this, 'Name', {
            value: this.resources.get('map').ref
        });
    }

    private constructInputParameters(parameterNames: Array<string>): Map<string, cdk.CfnParameter> {
        let parametersMap: Map<string, cdk.CfnParameter> = new Map();
        parameterNames.forEach(parameterName => {
            const inputParameter = new cdk.CfnParameter(this, parameterName, { type: 'String' })
            parametersMap.set(parameterName, inputParameter);
        });
        return parametersMap;
    }

    private constructResources(): Map<string, CfnResource> {
        let resourcesMap: Map<string, cdk.CfnResource> = new Map();

        const mapResource = this.constructMapResource();
        resourcesMap.set('map', mapResource);

        const mapPolicyResource = this.constructMapPolicyResource(mapResource);
        resourcesMap.set('mapPolicy', mapPolicyResource);

        return resourcesMap;
    }

    private constructMapResource(): CfnResource {
        return new location.CfnMap(this, 'Map', {
            mapName: this.mapName,
            configuration: {
                style: this.mapStyle
            },
            pricingPlan: this.pricingPlan
        });
    }

    toCloudFormation() {
        prepareApp(this);
        const cfn = this._toCloudFormation();
        return cfn;
    }

    private constructMapPolicyResource(mapResource: CfnResource): CfnResource {
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
        cognitoRoles.push(this.parameters.get('authRoleName').valueAsString);
        if (this.accessType == AccessType.AuthorizedAndGuestUsers) {
            cognitoRoles.push(this.parameters.get('unauthRoleName').valueAsString);
        }

        return new iam.CfnPolicy(this, 'MapPolicy', {
            policyName: `${this.mapName}Policy`,
            roles: cognitoRoles,
            policyDocument: policy
        });
    }
}