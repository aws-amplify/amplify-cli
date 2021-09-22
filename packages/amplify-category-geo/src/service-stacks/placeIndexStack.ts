import * as cdk from '@aws-cdk/core';
import * as location from '@aws-cdk/aws-location';
import * as iam from '@aws-cdk/aws-iam';
import { CfnResource, Fn } from '@aws-cdk/core';
import { PlaceIndexParameters } from '../service-utils/placeIndexParams';
import { AccessType } from '../service-utils/resourceParams';
import { BaseStack } from './baseStack';

export class PlaceIndexStack extends BaseStack {
  protected readonly accessType: string;

  constructor(scope: cdk.Construct, id: string, private readonly props: Pick<PlaceIndexParameters, 'accessType'>) {
    super(scope, id);

    this.accessType = this.props.accessType;

    this.parameters = this.constructInputParameters([
      'authRoleName',
      'unauthRoleName',
      'indexName',
      'dataProvider',
      'dataSourceIntendedUse',
      'pricingPlan',
      'env',
      'isDefault',
    ]);
    this.resources = this.constructResources();

    new cdk.CfnOutput(this, 'Name', {
      value: this.resources.get('placeIndex')!.ref,
    });
  }

  private constructResources(): Map<string, cdk.CfnResource> {
    let resourcesMap: Map<string, cdk.CfnResource> = new Map();

    const indexResource = this.constructIndexResource();
    resourcesMap.set('placeIndex', indexResource);

    const indexPolicyResource = this.constructIndexPolicyResource(indexResource);
    resourcesMap.set('indexPolicy', indexPolicyResource);

    return resourcesMap;
  }

  private constructIndexResource(): CfnResource {
    return new location.CfnPlaceIndex(this, 'PlaceIndex', {
      indexName: Fn.join('-', [this.parameters.get('indexName')!.valueAsString, this.parameters.get('env')!.valueAsString]),
      dataSource: this.parameters.get('dataProvider')!.valueAsString,
      dataSourceConfiguration: {
        intendedUse: this.parameters.get('dataSourceIntendedUse')!.valueAsString,
      },
      pricingPlan: this.parameters.get('pricingPlan')!.valueAsString,
    });
  }

  // Grant read-only access to the Place Index for Authorized and/or Guest users
  private constructIndexPolicyResource(indexResource: CfnResource): CfnResource {
    let policy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['geo:SearchPlaceIndexForPosition', 'geo:SearchPlaceIndexForText'],
          resources: [indexResource.getAtt('IndexArn').toString()],
        }),
      ],
    });

    let cognitoRoles: Array<string> = new Array();
    cognitoRoles.push(this.parameters.get('authRoleName')!.valueAsString);
    if (this.accessType == AccessType.AuthorizedAndGuestUsers) {
      cognitoRoles.push(this.parameters.get('unauthRoleName')!.valueAsString);
    }

    return new iam.CfnPolicy(this, 'PlaceIndexPolicy', {
      policyName: cdk.Fn.join('-', [this.parameters.get('indexName')!.valueAsString, this.parameters.get('env')!.valueAsString, 'Policy']),
      roles: cognitoRoles,
      policyDocument: policy,
    });
  }
}
