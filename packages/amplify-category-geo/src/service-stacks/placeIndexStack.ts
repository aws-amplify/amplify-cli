import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { CfnResource, Duration, Fn } from '@aws-cdk/core';
import { PlaceIndexParameters } from '../service-utils/placeIndexParams';
import { AccessType } from '../service-utils/resourceParams';
import { BaseStack, TemplateMappings } from './baseStack';
import { Effect } from '@aws-cdk/aws-iam';
import { customPlaceIndexLambdaCodePath } from '../service-utils/constants';
import * as fs from 'fs-extra';
import { Runtime } from '@aws-cdk/aws-lambda';

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
    new cdk.CfnOutput(this, 'Arn', {
      value: this.placeIndexResource.getAtt('IndexArn').toString()
    });
  }

  private constructIndexResource(): cdk.CustomResource {
    const geoCreateIndexStatement = new iam.PolicyStatement({
      effect: Effect.ALLOW
    });
    geoCreateIndexStatement.addActions('geo:CreatePlaceIndex');
    geoCreateIndexStatement.addAllResources();

    const placeIndexARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:place-index/${indexName}', {
      region: this.placeIndexRegion,
      account: cdk.Fn.ref('AWS::AccountId'),
      indexName: this.placeIndexName
    });

    const geoUpdateDeleteIndexStatement = new iam.PolicyStatement({
      effect: Effect.ALLOW
    });
    geoUpdateDeleteIndexStatement.addActions('geo:UpdatePlaceIndex', 'geo:DeletePlaceIndex');
    geoUpdateDeleteIndexStatement.addResources(placeIndexARN);

    const dataSource = this.parameters.get('dataProvider')!.valueAsString;

    const dataSourceIntendedUse = this.parameters.get('dataSourceIntendedUse')!.valueAsString;

    const indexPricingPlan = this.parameters.get('pricingPlan')!.valueAsString;

    const customPlaceIndexLambdaCode = fs.readFileSync(customPlaceIndexLambdaCodePath, 'utf-8');
    const customPlaceIndexLambda = new lambda.Function(this, 'CustomPlaceIndexLambda', {
      code: lambda.Code.fromInline(customPlaceIndexLambdaCode),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_14_X,
      timeout: Duration.seconds(300)
    });
    customPlaceIndexLambda.addToRolePolicy(geoCreateIndexStatement);
    customPlaceIndexLambda.addToRolePolicy(geoUpdateDeleteIndexStatement);

    const placeIndexCustomResource = new cdk.CustomResource(this, 'CustomPlaceIndex', {
      serviceToken: customPlaceIndexLambda.functionArn,
      resourceType: 'Custom::LambdaCallout',
      properties: {
        indexName: this.placeIndexName,
        dataSource: dataSource,
        dataSourceIntendedUse: dataSourceIntendedUse,
        pricingPlan: indexPricingPlan,
        region: this.placeIndexRegion,
        env: cdk.Fn.ref('env'),
      }
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
