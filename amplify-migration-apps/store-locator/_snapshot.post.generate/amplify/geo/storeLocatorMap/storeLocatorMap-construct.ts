import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface geostoreLocatorMapProps {
  /**
   */
  readonly authuserPoolGroupsstoreLocatorAdminGroupRole: string;
  /**
   */
  readonly authstorelocator41a9495f41a9495fUserPoolId: string;
  /**
   */
  readonly authRoleName: string;
  /**
   */
  readonly unauthRoleName: string;
  /**
   */
  readonly mapName: string;
  /**
   */
  readonly mapStyle: string;
  /**
   */
  readonly isDefault: string;
  /**
   */
  readonly branchName: string;
}

/**
 * {"createdOn":"Mac","createdBy":"Amplify","createdWith":"14.3.0","stackType":"geo-Map","metadata":{"whyContinueWithGen1":"Prefer not to answer"}}
 */
export class geostoreLocatorMap extends Construct {
  public readonly name;
  public readonly style;
  public readonly region;
  public readonly arn;

  public constructor(
    scope: Construct,
    id: string,
    props: geostoreLocatorMapProps
  ) {
    super(scope, id);

    // Mappings
    const regionMapping = new cdk.CfnMapping(this, 'RegionMapping', {
      mapping: {
        'us-east-1': {
          locationServiceRegion: 'us-east-1',
        },
        'us-east-2': {
          locationServiceRegion: 'us-east-2',
        },
        'us-west-2': {
          locationServiceRegion: 'us-west-2',
        },
        'ap-southeast-1': {
          locationServiceRegion: 'ap-southeast-1',
        },
        'ap-southeast-2': {
          locationServiceRegion: 'ap-southeast-2',
        },
        'ap-northeast-1': {
          locationServiceRegion: 'ap-northeast-1',
        },
        'eu-central-1': {
          locationServiceRegion: 'eu-central-1',
        },
        'eu-north-1': {
          locationServiceRegion: 'eu-north-1',
        },
        'eu-west-1': {
          locationServiceRegion: 'eu-west-1',
        },
        'sa-east-1': {
          locationServiceRegion: 'us-east-1',
        },
        'ca-central-1': {
          locationServiceRegion: 'us-east-1',
        },
        'us-west-1': {
          locationServiceRegion: 'us-west-2',
        },
        'cn-north-1': {
          locationServiceRegion: 'us-west-2',
        },
        'cn-northwest-1': {
          locationServiceRegion: 'us-west-2',
        },
        'ap-south-1': {
          locationServiceRegion: 'us-west-2',
        },
        'ap-northeast-3': {
          locationServiceRegion: 'us-west-2',
        },
        'ap-northeast-2': {
          locationServiceRegion: 'us-west-2',
        },
        'eu-west-2': {
          locationServiceRegion: 'eu-west-1',
        },
        'eu-west-3': {
          locationServiceRegion: 'eu-west-1',
        },
        'me-south-1': {
          locationServiceRegion: 'ap-southeast-1',
        },
      },
    });

    // Resources
    const customMapLambdaServiceRole4Ee7732c = new iam.CfnRole(
      this,
      'CustomMapLambdaServiceRole4EE7732C',
      {
        assumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
          Version: '2012-10-17',
        },
        managedPolicyArns: [
          [
            'arn:',
            cdk.Stack.of(this).partition,
            ':iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
          ].join(''),
        ],
      }
    );

    const customMapLambdaServiceRoleDefaultPolicy983Fdd4e = new iam.CfnPolicy(
      this,
      'CustomMapLambdaServiceRoleDefaultPolicy983FDD4E',
      {
        policyDocument: {
          Statement: [
            {
              Action: 'geo:CreateMap',
              Effect: 'Allow',
              Resource: '*',
            },
            {
              Action: ['geo:UpdateMap', 'geo:DeleteMap'],
              Effect: 'Allow',
              Resource: `arn:aws:geo:${regionMapping.findInMap(
                cdk.Stack.of(this).region,
                'locationServiceRegion'
              )}:${cdk.Stack.of(this).account}:map/${[
                props.mapName!,
                props.branchName!,
              ].join('-')}`,
            },
          ],
          Version: '2012-10-17',
        },
        policyName: 'CustomMapLambdaServiceRoleDefaultPolicy983FDD4E',
        roles: [customMapLambdaServiceRole4Ee7732c.ref],
      }
    );

    const customMapLambda51D5d430 = new lambda.CfnFunction(
      this,
      'CustomMapLambda51D5D430',
      {
        code: {
          zipFile:
            "const response = require('cfn-response');\nconst { LocationClient, CreateMapCommand, DeleteMapCommand, UpdateMapCommand } = require('@aws-sdk/client-location');\nexports.handler = async function (event, context) {\n  try {\n    console.log('REQUEST RECEIVED:' + JSON.stringify(event));\n    const pricingPlan = 'RequestBasedUsage';\n    if (event.RequestType === 'Create') {\n      let params = {\n        MapName: event.ResourceProperties.mapName,\n        Configuration: {\n          Style: event.ResourceProperties.mapStyle,\n        },\n        PricingPlan: pricingPlan,\n      };\n      const locationClient = new LocationClient({ region: event.ResourceProperties.region });\n      const res = await locationClient.send(new CreateMapCommand(params));\n      console.log('create resource response data' + JSON.stringify(res));\n      if (res.MapName && res.MapArn) {\n        await response.send(event, context, response.SUCCESS, res, params.MapName);\n      } else {\n        await response.send(event, context, response.FAILED, res, params.MapName);\n      }\n    }\n    if (event.RequestType === 'Update') {\n      let params = {\n        MapName: event.ResourceProperties.mapName,\n        PricingPlan: pricingPlan,\n      };\n      const locationClient = new LocationClient({ region: event.ResourceProperties.region });\n      const res = await locationClient.send(new UpdateMapCommand(params));\n      console.log('update resource response data' + JSON.stringify(res));\n      if (res.MapName && res.MapArn) {\n        await response.send(event, context, response.SUCCESS, res, params.MapName);\n      } else {\n        await response.send(event, context, response.FAILED, res, params.MapName);\n      }\n    }\n    if (event.RequestType === 'Delete') {\n      let params = {\n        MapName: event.ResourceProperties.mapName,\n      };\n      const locationClient = new LocationClient({ region: event.ResourceProperties.region });\n      const res = await locationClient.send(new DeleteMapCommand(params));\n      console.log('delete resource response data' + JSON.stringify(res));\n      await response.send(event, context, response.SUCCESS, res, params.MapName);\n    }\n  } catch (err) {\n    console.log(err.stack);\n    const res = { Error: err };\n    await response.send(event, context, response.FAILED, res, event.ResourceProperties.mapName);\n    throw err;\n  }\n};\n",
        },
        handler: 'index.handler',
        role: customMapLambdaServiceRole4Ee7732c.attrArn,
        runtime: 'nodejs22.x',
        timeout: 300,
      }
    );
    customMapLambda51D5d430.addDependency(
      customMapLambdaServiceRoleDefaultPolicy983Fdd4e
    );
    customMapLambda51D5d430.addDependency(customMapLambdaServiceRole4Ee7732c);

    const customMap = new cdk.CfnCustomResource(this, 'CustomMap', {
      serviceToken: customMapLambda51D5d430.attrArn,
    });
    customMap.addOverride('Type', 'Custom::LambdaCallout');
    customMap.addPropertyOverride(
      'mapName',
      [props.mapName!, props.branchName!].join('-')
    );
    customMap.addPropertyOverride('mapStyle', props.mapStyle!);
    customMap.addPropertyOverride(
      'region',
      regionMapping.findInMap(
        cdk.Stack.of(this).region,
        'locationServiceRegion'
      )
    );
    customMap.addPropertyOverride('env', props.branchName!);
    customMap.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.DELETE;

    const mapPolicy = new iam.CfnPolicy(this, 'MapPolicy', {
      policyDocument: {
        Statement: [
          {
            Action: [
              'geo:GetMapStyleDescriptor',
              'geo:GetMapGlyphs',
              'geo:GetMapSprites',
              'geo:GetMapTile',
            ],
            Effect: 'Allow',
            Resource: customMap.getAtt('MapArn').toString(),
          },
        ],
        Version: '2012-10-17',
      },
      policyName: [
        [props.mapName!, props.branchName!].join('-'),
        'Policy',
      ].join(''),
      roles: [
        props.authRoleName!,
        props.unauthRoleName!,
        props.authuserPoolGroupsstoreLocatorAdminGroupRole!,
      ],
    });

    // Outputs
    this.name = customMap.getAtt('MapName').toString();
    new cdk.CfnOutput(this, 'CfnOutputName', {
      key: 'Name',
      value: this.name!.toString(),
    });
    this.style = props.mapStyle!;
    new cdk.CfnOutput(this, 'CfnOutputStyle', {
      key: 'Style',
      value: this.style!.toString(),
    });
    this.region = regionMapping.findInMap(
      cdk.Stack.of(this).region,
      'locationServiceRegion'
    );
    new cdk.CfnOutput(this, 'CfnOutputRegion', {
      key: 'Region',
      value: this.region!.toString(),
    });
    this.arn = customMap.getAtt('MapArn').toString();
    new cdk.CfnOutput(this, 'CfnOutputArn', {
      key: 'Arn',
      value: this.arn!.toString(),
    });
  }
}
