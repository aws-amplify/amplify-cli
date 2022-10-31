/* eslint-disable no-new */
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as fs from 'fs-extra';
import * as lambda from '@aws-cdk/aws-lambda';
import { Effect } from '@aws-cdk/aws-iam';
import { Duration, Fn } from '@aws-cdk/core';
import { Runtime } from '@aws-cdk/aws-lambda';
import _ from 'lodash';
import { DeviceLocationTrackingParameters } from '../service-utils/deviceLocationTrackingParams';
import { BaseStack, TemplateMappings } from './baseStack';
import { customDeviceLocationTrackingLambdaCodePath } from '../service-utils/constants';
import { deviceLocationTrackingCrudPermissionsMap } from '../service-utils/deviceLocationTrackingConstants';

type DeviceLocationTrackingStackProps = Pick<DeviceLocationTrackingParameters, 'roleAndGroupPermissionsMap' | 'groupPermissions'> &
  TemplateMappings & { authResourceName: string };

/**
 * DeviceLocationTrackingStack
 */
export class DeviceLocationTrackingStack extends BaseStack {
  protected readonly groupPermissions: string[];
  protected readonly roleAndGroupPermissionsMap: Record<string, string[]>;
  protected readonly trackingResource: cdk.CustomResource;
  protected readonly trackingRegion: string;
  protected readonly trackerName: string;
  protected readonly authResourceName: string;

  constructor(scope: cdk.Construct, id: string, private readonly props: DeviceLocationTrackingStackProps) {
    super(scope, id, props);

    this.groupPermissions = this.props.groupPermissions;
    this.roleAndGroupPermissionsMap = this.props.roleAndGroupPermissionsMap;
    this.authResourceName = this.props.authResourceName;
    this.trackingRegion = this.regionMapping.findInMap(cdk.Fn.ref('AWS::Region'), 'locationServiceRegion');

    const inputParameters: string[] = this.groupPermissions.map(
      // eslint-disable-next-line spellcheck/spell-checker
      (group: string) => `authuserPoolGroups${group}GroupRole`,
    );
    inputParameters.push(
      `auth${this.authResourceName}UserPoolId`,
      'authRoleName',
      'unauthRoleName',
      'trackerName',
      'env',
      'isDefault',
    );
    this.parameters = this.constructInputParameters(inputParameters);

    this.trackerName = Fn.join('-', [this.parameters.get('trackerName')!.valueAsString, this.parameters.get('env')!.valueAsString]);

    this.trackingResource = this.constructTrackingResource();
    this.constructTrackingPolicyResources(this.trackingResource);
    this.constructOutputs();
  }

  private constructOutputs(): void {
    new cdk.CfnOutput(this, 'Name', {
      value: this.trackingResource.getAtt('TrackerName').toString(),
    });
    new cdk.CfnOutput(this, 'Region', {
      value: this.trackingRegion,
    });

    // This is a work-around until the TrackingArn is included in the `UpdateTracker` output
    const outputTrackingArn = cdk.Fn.sub('arn:aws:geo:${region}:${account}:tracker/${trackerName}', {
      region: this.trackingRegion,
      account: cdk.Fn.ref('AWS::AccountId'),
      collectionName: this.trackingResource.getAtt('TrackerName').toString(),
    });

    new cdk.CfnOutput(this, 'Arn', {
      value: outputTrackingArn,
    });
  }

  private constructTrackingResource(): cdk.CustomResource {
    const geoCreateTrackingStatement = new iam.PolicyStatement({
      effect: Effect.ALLOW,
    });
    geoCreateTrackingStatement.addActions('geo:CreateTracker');
    geoCreateTrackingStatement.addAllResources();

    const trackingARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:tracker/${trackerName}', {
      region: this.trackingRegion,
      account: cdk.Fn.ref('AWS::AccountId'),
      trackerName: this.trackerName,
    });

    const geoUpdateDeleteTrackingStatement = new iam.PolicyStatement({
      effect: Effect.ALLOW,
    });
    geoUpdateDeleteTrackingStatement.addActions('geo:UpdateTracker', 'geo:DeleteTracker');
    geoUpdateDeleteTrackingStatement.addResources(trackingARN);

    // set up custom params

    const customTrackingLambdaCode = fs.readFileSync(customDeviceLocationTrackingLambdaCodePath, 'utf-8');
    const customTrackingLambda = new lambda.Function(this, 'customTrackingLambda', {
      code: lambda.Code.fromInline(customTrackingLambdaCode),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_14_X,
      timeout: Duration.seconds(300),
    });
    customTrackingLambda.addToRolePolicy(geoCreateTrackingStatement);
    customTrackingLambda.addToRolePolicy(geoUpdateDeleteTrackingStatement);

    const trackingCustomResource = new cdk.CustomResource(this, 'CustomTracking', {
      serviceToken: customTrackingLambda.functionArn,
      resourceType: 'Custom::LambdaCallout',
      properties: {
        trackerName: this.trackerName,
        region: this.trackingRegion,
        env: cdk.Fn.ref('env'),
      },
    });

    return trackingCustomResource;
  }

  // Grant read-only access to the Tracking Index for Authorized and/or Guest users
  private constructTrackingPolicyResources(trackingResource: cdk.CustomResource): void {
    Object.keys(this.roleAndGroupPermissionsMap).forEach((group: string) => {
      const crudActions: string[] = _.uniq(_.flatten(this.roleAndGroupPermissionsMap[group]
        .map((permission: string) => deviceLocationTrackingCrudPermissionsMap[permission])));

      // This is a work-around until the TrackingArn is included in the `UpdateTracker` output
      const outputTrackingArn = cdk.Fn.sub('arn:aws:geo:${region}:${account}:tracker/${trackerName}', {
        region: this.trackingRegion,
        account: cdk.Fn.ref('AWS::AccountId'),
        collectionName: trackingResource.getAtt('TrackerName').toString(),
      });
      const policyDocument = new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: crudActions,
            resources: [outputTrackingArn],
            conditions: {
              StringLike: {
                'geo:DeviceIds': [
                  '${cognito-identity.amazonaws.com:sub}',
                ],
              },
            },
          }),
        ],
      });

      let roleName: string;
      if (group === 'authenticated') {
        roleName = this.parameters.get('authRoleName')!.valueAsString;
      } else if (group === 'guest') {
        roleName = this.parameters.get('unauthRoleName')!.valueAsString;
      } else {
        roleName = cdk.Fn.join('-',
          [
              this.parameters.get(`auth${this.authResourceName}UserPoolId`)!.valueAsString,
              `${group}GroupRole`,
          ]);
      }

      new iam.CfnPolicy(this, `${group}DeviceLocationTrackingPolicy`, {
        policyName: `${this.trackerName}Policy`,
        roles: [roleName],
        policyDocument,
      });
    });
  }
}
