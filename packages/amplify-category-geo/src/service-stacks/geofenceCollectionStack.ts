import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration, Fn } from 'aws-cdk-lib';
import { Effect } from 'aws-cdk-lib/aws-iam';
import * as fs from 'fs-extra';
import _ from 'lodash';
import { Construct } from 'constructs';
import { customGeofenceCollectionLambdaCodePath } from '../service-utils/constants';
import { BaseStack, TemplateMappings } from './baseStack';
import { GeofenceCollectionParameters } from '../service-utils/geofenceCollectionParams';
// eslint-disable-next-line import/no-cycle
import { crudPermissionsMap } from '../service-utils/geofenceCollectionUtils';

type GeofenceCollectionStackProps = Pick<GeofenceCollectionParameters, 'groupPermissions'> &
  TemplateMappings & { authResourceName: string };

/**
 * geo fence collections stack class
 */
export class GeofenceCollectionStack extends BaseStack {
  protected readonly groupPermissions: Record<string, string[]>;
  protected readonly geofenceCollectionResource: cdk.CustomResource;
  protected readonly geofenceCollectionRegion: string;
  protected readonly geofenceCollectionName: string;
  protected readonly authResourceName: string;

  constructor(scope: Construct, id: string, private readonly props: GeofenceCollectionStackProps) {
    super(scope, id, props);

    this.groupPermissions = this.props.groupPermissions;
    this.authResourceName = this.props.authResourceName;
    this.geofenceCollectionRegion = this.regionMapping.findInMap(cdk.Fn.ref('AWS::Region'), 'locationServiceRegion');

    const inputParameters: string[] = Object.keys(this.props.groupPermissions).map(
      (group: string) => `authuserPoolGroups${group}GroupRole`,
    );
    inputParameters.push(`auth${this.authResourceName}UserPoolId`, 'collectionName', 'env', 'isDefault');
    this.parameters = this.constructInputParameters(inputParameters);

    this.geofenceCollectionName = Fn.join('-', [
      this.parameters.get('collectionName')!.valueAsString,
      this.parameters.get('env')!.valueAsString,
    ]);

    this.geofenceCollectionResource = this.constructCollectionResource();
    this.constructCollectionPolicyResources(this.geofenceCollectionResource);
    this.constructOutputs();
  }

  private constructOutputs(): void {
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'Name', {
      value: this.geofenceCollectionResource.getAtt('CollectionName').toString(),
    });
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'Region', {
      value: this.geofenceCollectionRegion,
    });
    // This is a work-around until the CollectionArn is included in the `UpdateGeofenceCollection` output
    const outputGeofenceCollectionARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:geofence-collection/${collectionName}', {
      region: this.geofenceCollectionRegion,
      account: cdk.Fn.ref('AWS::AccountId'),
      collectionName: this.geofenceCollectionResource.getAtt('CollectionName').toString(),
    });
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'Arn', {
      // value: this.geofenceCollectionResource.getAtt('CollectionArn').toString(),
      value: outputGeofenceCollectionARN,
    });
  }

  private constructCollectionResource(): cdk.CustomResource {
    const geoCreateCollectionStatement = new iam.PolicyStatement({
      effect: Effect.ALLOW,
    });
    geoCreateCollectionStatement.addActions('geo:CreateGeofenceCollection');
    geoCreateCollectionStatement.addAllResources();

    const geofenceCollectionARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:geofence-collection/${collectionName}', {
      region: this.geofenceCollectionRegion,
      account: cdk.Fn.ref('AWS::AccountId'),
      collectionName: this.geofenceCollectionName,
    });

    const geoUpdateDeleteCollectionStatement = new iam.PolicyStatement({
      effect: Effect.ALLOW,
    });
    geoUpdateDeleteCollectionStatement.addActions('geo:UpdateGeofenceCollection', 'geo:DeleteGeofenceCollection');
    geoUpdateDeleteCollectionStatement.addResources(geofenceCollectionARN);

    const customGeofenceCollectionLambdaCode = fs.readFileSync(customGeofenceCollectionLambdaCodePath, 'utf-8');
    const customGeofenceCollectionLambda = new lambda.Function(this, 'CustomGeofenceCollectionLambda', {
      code: lambda.Code.fromInline(customGeofenceCollectionLambdaCode),
      handler: 'index.handler',
      runtime: new lambda.Runtime('nodejs22.x', lambda.RuntimeFamily.NODEJS, { supportsInlineCode: true }),
      timeout: Duration.seconds(300),
    });
    customGeofenceCollectionLambda.addToRolePolicy(geoCreateCollectionStatement);
    customGeofenceCollectionLambda.addToRolePolicy(geoUpdateDeleteCollectionStatement);

    const geofenceCollectionCustomResource = new cdk.CustomResource(this, 'CustomGeofenceCollection', {
      serviceToken: customGeofenceCollectionLambda.functionArn,
      resourceType: 'Custom::LambdaCallout',
      properties: {
        collectionName: this.geofenceCollectionName,
        region: this.geofenceCollectionRegion,
        env: cdk.Fn.ref('env'),
      },
    });

    return geofenceCollectionCustomResource;
  }

  // Grant selected access permissions for Geofence operations to chosen Cognito Groups
  private constructCollectionPolicyResources(collectionResource: cdk.CustomResource): void {
    Object.keys(this.groupPermissions).forEach((group: string) => {
      // This is a work-around until the CollectionArn is included in the `UpdateGeofenceCollection` output
      const outputGeofenceCollectionARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:geofence-collection/${collectionName}', {
        region: this.geofenceCollectionRegion,
        account: cdk.Fn.ref('AWS::AccountId'),
        collectionName: collectionResource.getAtt('CollectionName').toString(),
      });

      const crudActions: string[] = _.uniq(
        _.flatten(this.groupPermissions[group].map((permission: string) => crudPermissionsMap[permission])),
      );
      const policyDocument = new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: crudActions,
            resources: [outputGeofenceCollectionARN],
          }),
        ],
      });

      // eslint-disable-next-line no-new
      new iam.CfnPolicy(this, `${group}GeofenceCollectionPolicy`, {
        policyName: `${group}${this.geofenceCollectionName}Policy`,
        roles: [cdk.Fn.join('-', [this.parameters.get(`auth${this.authResourceName}UserPoolId`)!.valueAsString, `${group}GroupRole`])],
        policyDocument,
      });
    });
  }
}
