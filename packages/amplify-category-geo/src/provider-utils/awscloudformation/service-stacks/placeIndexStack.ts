import * as cdk from '@aws-cdk/core';
import * as location from '@aws-cdk/aws-location';
import { CfnResource } from '@aws-cdk/core';
import { prepareApp } from '@aws-cdk/core/lib/private/prepare-app';
import { PlaceIndexParameters } from '../utils/placeIndexParams';

export class PlaceIndexStack extends cdk.Stack {
  protected readonly parameters: ReadonlyMap<string, cdk.CfnParameter>;
  protected readonly resources: ReadonlyMap<string, cdk.CfnResource>;
  protected readonly indexName: string;
  protected readonly dataStorage: string;
  protected readonly pricingPlan: string;
  protected readonly accessType: string;
  protected readonly dataSource: string;

  constructor(scope: cdk.Construct, id: string, private readonly props: PlaceIndexParameters) {
    super(scope, id);

    this.indexName = this.props.indexName;
    this.dataStorage = this.props.dataSourceIntendedUse;
    this.pricingPlan = this.props.pricingPlan;
    this.accessType = this.props.accessType;
    this.dataSource = this.props.dataProvider;

    this.parameters = this.constructInputParameters([
      'authRoleName',
      'unauthRoleName',
      'env'
    ]);
    this.resources = this.constructResources();

    new cdk.CfnOutput(this, 'IndexName', {
      value: this.resources.get('placeIndex').ref
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

  private constructResources(): Map<string, cdk.CfnResource> {
    let resourcesMap: Map<string, cdk.CfnResource> = new Map();
    const indexResource = this.constructIndexResource();
    resourcesMap.set('placeIndex', indexResource);
    return resourcesMap;
  }

  private constructIndexResource(): CfnResource {
    return new location.CfnPlaceIndex(
      this,
      'PlaceIndex',
      {
        indexName: this.indexName,
        dataSource: this.dataSource,
        pricingPlan: this.pricingPlan
      }
    );
  }

  toCloudFormation() {
    prepareApp(this);
    return this._toCloudFormation();
  }
}
