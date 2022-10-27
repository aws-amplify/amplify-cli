import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as fs from 'fs-extra';
import * as lambda from '@aws-cdk/aws-lambda';
import { Effect } from '@aws-cdk/aws-iam';
import { CfnResource, Duration, Fn } from '@aws-cdk/core';
import { Runtime } from '@aws-cdk/aws-lambda';
import { DeviceLocationTrackingParameters } from '../service-utils/deviceLocationTrackingParams';
import { BaseStack, TemplateMappings } from './baseStack';
import { customDeviceLocationTrackingLambdaCodePath } from '../service-utils/constants';
import { AccessType } from '../service-utils/resourceParams';

type DeviceLocationTrackingStackProps = Pick<DeviceLocationTrackingParameters, 'accessType' | 'groupPermissions'> &
  TemplateMappings & { authResourceName: string };

/**
 * DeviceLocationTrackingStack
 */
export class DeviceLocationTrackingStack extends BaseStack {
    protected readonly groupPermissions: string[];
    protected readonly accessType: string;
    protected readonly trackingResource: cdk.CustomResource;
    protected readonly trackingRegion: string;
    protected readonly trackingName: string;
    protected readonly authResourceName: string;

    constructor(scope: cdk.Construct, id: string, private readonly props: DeviceLocationTrackingStackProps) {
      super(scope, id, props);

      this.accessType = this.props.accessType;
      this.groupPermissions = this.props.groupPermissions;
      this.authResourceName = this.props.authResourceName;
      this.trackingRegion = this.regionMapping.findInMap(cdk.Fn.ref('AWS::Region'), 'locationServiceRegion');

      const inputParameters: string[] = (this.props.groupPermissions || []).map(
        (group: string) => `authuserPoolGroups${group}GroupRole`,
      );
      inputParameters.push(
        `auth${this.authResourceName}UserPoolId`,
        'authRoleName',
        'unauthRoleName',
        'trackingName',
        'env',
        'isDefault',
      );
      this.parameters = this.constructInputParameters(inputParameters);

      this.trackingName = Fn.join('-', [this.parameters.get('trackingName')!.valueAsString, this.parameters.get('env')!.valueAsString]);

      this.trackingResource = this.constructTrackingResource();
      this.constructTrackingPolicyResource(this.trackingResource);
      this.constructOutputs();
    }

    private constructOutputs(): void {
      new cdk.CfnOutput(this, 'Name', {
        value: this.trackingResource.getAtt('TrackingName').toString(),
      });
      new cdk.CfnOutput(this, 'Region', {
        value: this.trackingResource.getAtt('TrackingRegion').toString(),
      });
      new cdk.CfnOutput(this, 'Arn', {
        value: this.trackingResource.getAtt('TrackingArn').toString(),
      });
    }

    private constructTrackingResource(): cdk.CustomResource {
      const geoCreateTrackingStatement = new iam.PolicyStatement({
        effect: Effect.ALLOW,
      });
      geoCreateTrackingStatement.addActions('geo:CreateTracker');
      geoCreateTrackingStatement.addAllResources();

      const trackingARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:tracker/${trackingName}', {
        region: this.trackingRegion,
        account: cdk.Fn.ref('AWS::AccountId'),
        trackingName: this.trackingName,
      });

      const geoUpdateDeleteTrackingStatement = new iam.PolicyStatement({
        effect: Effect.ALLOW,
      });
      geoUpdateDeleteTrackingStatement.addActions('geo:UpdateTracker', 'geo:DeleteTracker');
      geoUpdateDeleteTrackingStatement.addResources(trackingARN);

      // set up custom params
      // ....
      // ....

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
          trackingName: this.trackingName,
          region: this.trackingRegion,
          env: cdk.Fn.ref('env'),
        },
      });

      return trackingCustomResource;
    }

    // Grant read-only access to the Tracking Index for Authorized and/or Guest users
    private constructTrackingPolicyResource(trackingResource: cdk.CustomResource): CfnResource {
      const policy = new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'geo:BatchGetDevicePosition',
              'geo:GetDevicePosition',
            ],
            resources: [trackingResource.getAtt('TrackingARN').toString()],
            conditions: {
              deviceContains: ['${cognito-identity.amazonaws.com:sub}'],
            },
          }),
        ],
      });

      const cognitoRoles: Array<string> = [];
      if (this.accessType === AccessType.AuthorizedUsers
        || this.accessType === AccessType.AuthorizedAndGuestUsers) {
        cognitoRoles.push(this.parameters.get('authRoleName')!.valueAsString);
      }
      if (this.accessType === AccessType.AuthorizedAndGuestUsers) {
        cognitoRoles.push(this.parameters.get('unauthRoleName')!.valueAsString);
      }
      if (this.groupPermissions && this.authResourceName) {
        this.groupPermissions.forEach((group: string) => {
          cognitoRoles.push(
            cdk.Fn.join('-',
              [
                this.parameters.get(`auth${this.authResourceName}UserPoolId`)!.valueAsString,
                `${group}GroupRole`,
              ]),
          );
        });
      }

      return new iam.CfnPolicy(this, 'DeviceLocationTrackingPolicy', {
        policyName: `${this.trackingName}Policy`,
        roles: cognitoRoles,
        policyDocument: policy,
      });
    }
}
