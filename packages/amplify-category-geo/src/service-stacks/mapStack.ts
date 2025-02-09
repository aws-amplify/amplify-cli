import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { CfnResource, Duration, Fn } from 'aws-cdk-lib';
import { Effect } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as fs from 'fs-extra';
import { MapParameters } from '../service-utils/mapParams';
import { AccessType } from '../service-utils/resourceParams';
import { BaseStack, TemplateMappings } from './baseStack';
import { customMapLambdaCodePath } from '../service-utils/constants';

type MapStackProps = Pick<MapParameters, 'accessType' | 'groupPermissions'> & TemplateMappings & { authResourceName: string };

/**
 * Class to generate cfn for Map resource
 */
export class MapStack extends BaseStack {
  protected readonly groupPermissions: string[];
  protected readonly accessType: string;
  protected readonly mapResource: cdk.CustomResource;
  protected readonly mapRegion: string;
  protected readonly mapName: string;
  protected readonly authResourceName: string;

  constructor(scope: Construct, id: string, private readonly props: MapStackProps) {
    super(scope, id, props);

    this.accessType = this.props.accessType;
    this.groupPermissions = this.props.groupPermissions;
    this.authResourceName = this.props.authResourceName;
    this.mapRegion = this.regionMapping.findInMap(cdk.Fn.ref('AWS::Region'), 'locationServiceRegion');

    const inputParameters: string[] = (this.props.groupPermissions || []).map((group: string) => `authuserPoolGroups${group}GroupRole`);
    inputParameters.push(
      `auth${this.authResourceName}UserPoolId`,
      'authRoleName',
      'unauthRoleName',
      'mapName',
      'mapStyle',
      'env',
      'isDefault',
    );
    this.parameters = this.constructInputParameters(inputParameters);

    this.mapName = Fn.join('-', [this.parameters.get('mapName')!.valueAsString, this.parameters.get('env')!.valueAsString]);
    this.mapResource = this.constructMapResource();
    this.constructMapPolicyResource(this.mapResource);
    this.constructOutputs();
  }

  private constructOutputs(): void {
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'Name', {
      value: this.mapResource.getAtt('MapName').toString(),
    });
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'Style', {
      value: this.parameters.get('mapStyle')!.valueAsString,
    });
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'Region', {
      value: this.mapRegion,
    });
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'Arn', {
      value: this.mapResource.getAtt('MapArn').toString(),
    });
  }

  private constructMapResource(): cdk.CustomResource {
    const geoCreateMapStatement = new iam.PolicyStatement({
      effect: Effect.ALLOW,
    });
    geoCreateMapStatement.addActions('geo:CreateMap');
    geoCreateMapStatement.addAllResources();

    const mapARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:map/${mapName}', {
      region: this.mapRegion,
      account: cdk.Fn.ref('AWS::AccountId'),
      mapName: this.mapName,
    });

    const geoUpdateDeleteMapStatement = new iam.PolicyStatement({
      effect: Effect.ALLOW,
    });
    geoUpdateDeleteMapStatement.addActions('geo:UpdateMap', 'geo:DeleteMap');
    geoUpdateDeleteMapStatement.addResources(mapARN);

    const mapStyle = this.parameters.get('mapStyle')!.valueAsString;

    const customMapLambdaCode = fs.readFileSync(customMapLambdaCodePath, 'utf-8');
    const customMapLambda = new lambda.Function(this, 'CustomMapLambda', {
      code: lambda.Code.fromInline(customMapLambdaCode),
      handler: 'index.handler',
      runtime: new lambda.Runtime('nodejs22.x', lambda.RuntimeFamily.NODEJS, { supportsInlineCode: true }),
      timeout: Duration.seconds(300),
    });
    customMapLambda.addToRolePolicy(geoCreateMapStatement);
    customMapLambda.addToRolePolicy(geoUpdateDeleteMapStatement);

    const mapCustomResource = new cdk.CustomResource(this, 'CustomMap', {
      serviceToken: customMapLambda.functionArn,
      resourceType: 'Custom::LambdaCallout',
      properties: {
        mapName: this.mapName,
        mapStyle,
        region: this.mapRegion,
        env: cdk.Fn.ref('env'),
      },
    });

    return mapCustomResource;
  }

  // Grant read-only access to the Map for Authorized and/or Guest users
  private constructMapPolicyResource(mapResource: cdk.CustomResource): CfnResource {
    const policy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          // eslint-disable-next-line spellcheck/spell-checker
          actions: ['geo:GetMapStyleDescriptor', 'geo:GetMapGlyphs', 'geo:GetMapSprites', 'geo:GetMapTile'],
          resources: [mapResource.getAtt('MapArn').toString()],
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

    return new iam.CfnPolicy(this, 'MapPolicy', {
      policyName: `${this.mapName}Policy`,
      roles: cognitoRoles,
      policyDocument: policy,
    });
  }
}
