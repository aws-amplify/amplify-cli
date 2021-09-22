import * as cdk from '@aws-cdk/core';
import * as location from '@aws-cdk/aws-location';
import * as iam from '@aws-cdk/aws-iam';
import { MapParameters } from '../service-utils/mapParams';
import { CfnResource, Fn } from '@aws-cdk/core';
import { AccessType } from '../service-utils/resourceParams';
import { BaseStack } from './baseStack';

export class MapStack extends BaseStack {
  protected readonly accessType: string;

  constructor(scope: cdk.Construct, id: string, private readonly props: Pick<MapParameters, 'accessType'>) {
    super(scope, id);

    this.accessType = this.props.accessType;

    this.parameters = this.constructInputParameters([
      'authRoleName',
      'unauthRoleName',
      'mapName',
      'mapStyle',
      'pricingPlan',
      'env',
      'isDefault',
    ]);

    this.resources = this.constructResources();

    new cdk.CfnOutput(this, 'Name', {
      value: this.resources.get('map')!.ref,
    });
    new cdk.CfnOutput(this, 'Style', {
      value: this.parameters.get('mapStyle')!.valueAsString,
    });
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
      mapName: Fn.join('-', [this.parameters.get('mapName')!.valueAsString, this.parameters.get('env')!.valueAsString]),
      configuration: {
        style: this.parameters.get('mapStyle')!.valueAsString,
      },
      pricingPlan: this.parameters.get('pricingPlan')!.valueAsString,
    });
  }

  // Grant read-only access to the Map for Authorized and/or Guest users
  private constructMapPolicyResource(mapResource: CfnResource): CfnResource {
    let policy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['geo:GetMapStyleDescriptor', 'geo:GetMapGlyphs', 'geo:GetMapSprites', 'geo:GetMapTile'],
          resources: [mapResource.getAtt('MapArn').toString()],
        }),
      ],
    });

    let cognitoRoles: Array<string> = new Array();
    cognitoRoles.push(this.parameters.get('authRoleName')!.valueAsString);
    if (this.accessType == AccessType.AuthorizedAndGuestUsers) {
      cognitoRoles.push(this.parameters.get('unauthRoleName')!.valueAsString);
    }

    return new iam.CfnPolicy(this, 'MapPolicy', {
      policyName: cdk.Fn.join('-', [this.parameters.get('mapName')!.valueAsString, this.parameters.get('env')!.valueAsString, 'Policy']),
      roles: cognitoRoles,
      policyDocument: policy,
    });
  }
}
