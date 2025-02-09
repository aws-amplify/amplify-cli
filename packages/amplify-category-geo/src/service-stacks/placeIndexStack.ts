import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CfnResource, Duration, Fn } from 'aws-cdk-lib';
import { Effect } from 'aws-cdk-lib/aws-iam';
import * as fs from 'fs-extra';
import { Construct } from 'constructs';
import { PlaceIndexParameters } from '../service-utils/placeIndexParams';
import { AccessType } from '../service-utils/resourceParams';
import { BaseStack, TemplateMappings } from './baseStack';
import { customPlaceIndexLambdaCodePath } from '../service-utils/constants';

type PlaceIndexStackProps = Pick<PlaceIndexParameters, 'accessType' | 'groupPermissions'> & TemplateMappings & { authResourceName: string };

/**
 * class to generate cfn for placeIndex resource
 */
export class PlaceIndexStack extends BaseStack {
  protected readonly groupPermissions: string[];
  protected readonly accessType: string;
  protected readonly placeIndexResource: cdk.CustomResource;
  protected readonly placeIndexRegion: string;
  protected readonly placeIndexName: string;
  protected readonly authResourceName: string;

  constructor(scope: Construct, id: string, private readonly props: PlaceIndexStackProps) {
    super(scope, id, props);

    this.accessType = this.props.accessType;
    this.groupPermissions = this.props.groupPermissions;
    this.authResourceName = this.props.authResourceName;
    this.placeIndexRegion = this.regionMapping.findInMap(cdk.Fn.ref('AWS::Region'), 'locationServiceRegion');

    const inputParameters: string[] = this.props.groupPermissions.map((group: string) => `authuserPoolGroups${group}GroupRole`);
    inputParameters.push(
      `auth${this.authResourceName}UserPoolId`,
      'authRoleName',
      'unauthRoleName',
      'indexName',
      'dataProvider',
      'dataSourceIntendedUse',
      'env',
      'isDefault',
    );
    this.parameters = this.constructInputParameters(inputParameters);

    this.placeIndexName = Fn.join('-', [this.parameters.get('indexName')!.valueAsString, this.parameters.get('env')!.valueAsString]);

    this.placeIndexResource = this.constructIndexResource();
    this.constructIndexPolicyResource(this.placeIndexResource);
    this.constructOutputs();
  }

  private constructOutputs(): void {
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'Name', {
      value: this.placeIndexResource.getAtt('IndexName').toString(),
    });
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'Region', {
      value: this.placeIndexRegion,
    });
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'Arn', {
      value: this.placeIndexResource.getAtt('IndexArn').toString(),
    });
  }

  private constructIndexResource(): cdk.CustomResource {
    const geoCreateIndexStatement = new iam.PolicyStatement({
      effect: Effect.ALLOW,
    });
    geoCreateIndexStatement.addActions('geo:CreatePlaceIndex');
    geoCreateIndexStatement.addAllResources();

    const placeIndexARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:place-index/${indexName}', {
      region: this.placeIndexRegion,
      account: cdk.Fn.ref('AWS::AccountId'),
      indexName: this.placeIndexName,
    });

    const geoUpdateDeleteIndexStatement = new iam.PolicyStatement({
      effect: Effect.ALLOW,
    });
    geoUpdateDeleteIndexStatement.addActions('geo:UpdatePlaceIndex', 'geo:DeletePlaceIndex');
    geoUpdateDeleteIndexStatement.addResources(placeIndexARN);

    const dataSource = this.parameters.get('dataProvider')!.valueAsString;

    const dataSourceIntendedUse = this.parameters.get('dataSourceIntendedUse')!.valueAsString;

    const customPlaceIndexLambdaCode = fs.readFileSync(customPlaceIndexLambdaCodePath, 'utf-8');
    const customPlaceIndexLambda = new lambda.Function(this, 'CustomPlaceIndexLambda', {
      code: lambda.Code.fromInline(customPlaceIndexLambdaCode),
      handler: 'index.handler',
      runtime: new lambda.Runtime('nodejs22.x', lambda.RuntimeFamily.NODEJS, { supportsInlineCode: true }),
      timeout: Duration.seconds(300),
    });
    customPlaceIndexLambda.addToRolePolicy(geoCreateIndexStatement);
    customPlaceIndexLambda.addToRolePolicy(geoUpdateDeleteIndexStatement);

    const placeIndexCustomResource = new cdk.CustomResource(this, 'CustomPlaceIndex', {
      serviceToken: customPlaceIndexLambda.functionArn,
      resourceType: 'Custom::LambdaCallout',
      properties: {
        indexName: this.placeIndexName,
        dataSource,
        dataSourceIntendedUse,
        region: this.placeIndexRegion,
        env: cdk.Fn.ref('env'),
      },
    });

    return placeIndexCustomResource;
  }

  // Grant read-only access to the Place Index for Authorized and/or Guest users
  private constructIndexPolicyResource(indexResource: cdk.CustomResource): CfnResource {
    const policy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['geo:SearchPlaceIndexForPosition', 'geo:SearchPlaceIndexForText', 'geo:SearchPlaceIndexForSuggestions', 'geo:GetPlace'],
          resources: [indexResource.getAtt('IndexArn').toString()],
        }),
      ],
    });

    const cognitoRoles: Array<string> = [];
    if (this.accessType === AccessType.AuthorizedUsers || this.accessType === AccessType.AuthorizedAndGuestUsers) {
      cognitoRoles.push(this.parameters.get('authRoleName')!.valueAsString);
    }
    if (this.accessType === AccessType.AuthorizedAndGuestUsers) {
      cognitoRoles.push(this.parameters.get('unauthRoleName')!.valueAsString);
    }
    if (this.groupPermissions && this.authResourceName) {
      this.groupPermissions.forEach((group: string) => {
        cognitoRoles.push(
          cdk.Fn.join('-', [this.parameters.get(`auth${this.authResourceName}UserPoolId`)!.valueAsString, `${group}GroupRole`]),
        );
      });
    }

    return new iam.CfnPolicy(this, 'PlaceIndexPolicy', {
      policyName: `${this.placeIndexName}Policy`,
      roles: cognitoRoles,
      policyDocument: policy,
    });
  }
}
