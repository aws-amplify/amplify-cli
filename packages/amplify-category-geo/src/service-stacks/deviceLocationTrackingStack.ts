/* eslint-disable no-new */
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as location from 'aws-cdk-lib/aws-location';
import _ from 'lodash';
import { Construct } from 'constructs';
import { DeviceLocationTrackingParameters } from '../service-utils/deviceLocationTrackingParams';
import { BaseStack, TemplateMappings } from './baseStack';
import { deviceLocationTrackingCrudPermissionsMap } from '../service-utils/deviceLocationTrackingConstants';

type DeviceLocationTrackingStackProps = DeviceLocationTrackingParameters &
  TemplateMappings & { authResourceName: string };

/**
 * Device location tracking stack class
 */
export class DeviceLocationTrackingStack extends BaseStack {
  protected readonly groupPermissions: string[];
  protected readonly roleAndGroupPermissionsMap: Record<string, string[]>;
  protected readonly trackingRegion: string;
  protected readonly trackerName: string;
  protected readonly authResourceName: string;

  constructor(scope: Construct, id: string, private readonly props: DeviceLocationTrackingStackProps) {
    super(scope, id, props);

    this.groupPermissions = this.props.groupPermissions;
    this.roleAndGroupPermissionsMap = this.props.roleAndGroupPermissionsMap;
    this.authResourceName = this.props.authResourceName;
    this.trackingRegion = this.regionMapping.findInMap(cdk.Fn.ref('AWS::Region'), 'locationServiceRegion');

    const inputParameters: string[] = this.groupPermissions.map(
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
    if (this.props.positionFiltering) inputParameters.push('positionFiltering');
    if (this.props.linkedGeofenceCollections) inputParameters.push('linkedGeofenceCollections');

    this.parameters = this.constructInputParameters(inputParameters);

    this.trackerName = cdk.Fn.join('-', [this.parameters.get('trackerName')!.valueAsString, this.parameters.get('env')!.valueAsString]);

    const trackerResource = this.constructCfnTrackingResource();
    this.constructCfnTrackerConsumerResource(trackerResource);
    this.constructTrackingPolicyResources(trackerResource);
    this.constructOutputs(trackerResource);
  }

  private constructOutputs(trackerResource: location.CfnTracker): void {
    new cdk.CfnOutput(this, 'Name', {
      value: this.trackerName,
    });
    new cdk.CfnOutput(this, 'Region', {
      value: this.trackingRegion,
    });
    new cdk.CfnOutput(this, 'Arn', {
      value: trackerResource.attrTrackerArn,
    });
  }

  private constructCfnTrackingResource(): location.CfnTracker {
    const positionFiltering = this.parameters.get('positionFiltering')?.valueAsString;

    const trackerResource = new location.CfnTracker(this, `CfnTracker`, {
      trackerName: this.trackerName,
      positionFiltering,
    });
    return trackerResource;
  }

  private constructCfnTrackerConsumerResource(trackerResource: location.CfnTracker): void {
    const { linkedGeofenceCollections } = this.props;
    linkedGeofenceCollections?.forEach(linkedGeofenceCollection => {
      const linkedGeofenceCollectionArn = cdk.Fn.sub(
        'arn:aws:geo:${region}:${account}:geofence-collection/${linkedGeofenceCollection}',
        {
          region: this.trackingRegion,
          account: cdk.Fn.ref('AWS::AccountId'),
          linkedGeofenceCollection,
        },
      );
      const trackerConsumerResource = new location.CfnTrackerConsumer(
        this,
        `CfnTrackerConsumer-${linkedGeofenceCollection}`,
        {
          consumerArn: linkedGeofenceCollectionArn,
          trackerName: this.trackerName,
        },
      );
      trackerConsumerResource.addDependsOn(trackerResource);
    });
  }

  // Grant read-only access to the Tracking Index for Authorized and/or Guest users
  private constructTrackingPolicyResources(trackerResource: location.CfnTracker): void {
    Object.keys(this.roleAndGroupPermissionsMap).forEach((group: string) => {
      const crudActions: string[] = _.uniq(_.flatten(this.roleAndGroupPermissionsMap[group]
        .map((permission: string) => deviceLocationTrackingCrudPermissionsMap[permission])));

      let accessConditions;
      if (!this.props.selectedUserGroups?.includes(group)) {
        accessConditions = {
          StringLike: {
            'geo:DeviceIds': [
              '${cognito-identity.amazonaws.com:sub}',
            ],
          },
        };
      }
      const policyDocument = new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: crudActions,
            resources: [trackerResource.attrTrackerArn],
            conditions: accessConditions,
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
