import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface geostoreLocatorGeofenceProps {
  /**
   */
  readonly authuserPoolGroupsstoreLocatorAdminGroupRole: string;
  /**
   */
  readonly authstorelocator41a9495f41a9495fUserPoolId: string;
  /**
   */
  readonly collectionName: string;
  /**
   */
  readonly isDefault: string;
  /**
   */
  readonly branchName: string;
}

/**
 * {"createdOn":"Mac","createdBy":"Amplify","createdWith":"14.3.0","stackType":"geo-GeofenceCollection","metadata":{"whyContinueWithGen1":"Prefer not to answer"}}
 */
export class geostoreLocatorGeofence extends Construct {
  public readonly name;
  public readonly region;
  public readonly arn;

  public constructor(
    scope: Construct,
    id: string,
    props: geostoreLocatorGeofenceProps
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
    const customGeofenceCollectionLambdaServiceRole9040D551 = new iam.CfnRole(
      this,
      'CustomGeofenceCollectionLambdaServiceRole9040D551',
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

    const customGeofenceCollectionLambdaServiceRoleDefaultPolicy0A18b369 =
      new iam.CfnPolicy(
        this,
        'CustomGeofenceCollectionLambdaServiceRoleDefaultPolicy0A18B369',
        {
          policyDocument: {
            Statement: [
              {
                Action: 'geo:CreateGeofenceCollection',
                Effect: 'Allow',
                Resource: '*',
              },
              {
                Action: [
                  'geo:UpdateGeofenceCollection',
                  'geo:DeleteGeofenceCollection',
                ],
                Effect: 'Allow',
                Resource: `arn:aws:geo:${regionMapping.findInMap(
                  cdk.Stack.of(this).region,
                  'locationServiceRegion'
                )}:${cdk.Stack.of(this).account}:geofence-collection/${[
                  props.collectionName!,
                  props.branchName!,
                ].join('-')}`,
              },
            ],
            Version: '2012-10-17',
          },
          policyName:
            'CustomGeofenceCollectionLambdaServiceRoleDefaultPolicy0A18B369',
          roles: [customGeofenceCollectionLambdaServiceRole9040D551.ref],
        }
      );

    const customGeofenceCollectionLambdaCa3d002b = new lambda.CfnFunction(
      this,
      'CustomGeofenceCollectionLambdaCA3D002B',
      {
        code: {
          zipFile:
            "const response = require('cfn-response');\nconst {\n  LocationClient,\n  CreateGeofenceCollectionCommand,\n  DeleteGeofenceCollectionCommand,\n  UpdateGeofenceCollectionCommand,\n} = require('@aws-sdk/client-location');\nexports.handler = async function (event, context) {\n  try {\n    console.log('REQUEST RECEIVED:' + JSON.stringify(event));\n    const pricingPlan = 'RequestBasedUsage';\n    if (event.RequestType === 'Create') {\n      const params = {\n        CollectionName: event.ResourceProperties.collectionName,\n        PricingPlan: pricingPlan,\n      };\n      const locationClient = new LocationClient({ region: event.ResourceProperties.region });\n      const res = await locationClient.send(new CreateGeofenceCollectionCommand(params));\n      console.log('create resource response data' + JSON.stringify(res));\n      if (res.CollectionName && res.CollectionArn) {\n        await response.send(event, context, response.SUCCESS, res, params.CollectionName);\n      } else {\n        await response.send(event, context, response.FAILED, res, params.CollectionName);\n      }\n    }\n    if (event.RequestType === 'Update') {\n      const params = {\n        CollectionName: event.ResourceProperties.collectionName,\n        PricingPlan: pricingPlan,\n      };\n      const locationClient = new LocationClient({ region: event.ResourceProperties.region });\n      const res = await locationClient.send(new UpdateGeofenceCollectionCommand(params));\n      console.log('update resource response data' + JSON.stringify(res));\n      if (res.CollectionName) {\n        await response.send(event, context, response.SUCCESS, res, params.CollectionName);\n      } else {\n        await response.send(event, context, response.FAILED, res, params.CollectionName);\n      }\n    }\n    if (event.RequestType === 'Delete') {\n      const params = {\n        CollectionName: event.ResourceProperties.collectionName,\n      };\n      const locationClient = new LocationClient({ region: event.ResourceProperties.region });\n      const res = await locationClient.send(new DeleteGeofenceCollectionCommand(params));\n      console.log('delete resource response data' + JSON.stringify(res));\n      await response.send(event, context, response.SUCCESS, res, params.CollectionName);\n    }\n  } catch (err) {\n    console.log(err.stack);\n    const res = { Error: err };\n    await response.send(event, context, response.FAILED, res, event.ResourceProperties.collectionName);\n    throw err;\n  }\n};\n",
        },
        handler: 'index.handler',
        role: customGeofenceCollectionLambdaServiceRole9040D551.attrArn,
        runtime: 'nodejs22.x',
        timeout: 300,
      }
    );
    customGeofenceCollectionLambdaCa3d002b.addDependency(
      customGeofenceCollectionLambdaServiceRoleDefaultPolicy0A18b369
    );
    customGeofenceCollectionLambdaCa3d002b.addDependency(
      customGeofenceCollectionLambdaServiceRole9040D551
    );

    const customGeofenceCollection = new cdk.CfnCustomResource(
      this,
      'CustomGeofenceCollection',
      {
        serviceToken: customGeofenceCollectionLambdaCa3d002b.attrArn,
      }
    );
    customGeofenceCollection.addOverride('Type', 'Custom::LambdaCallout');
    customGeofenceCollection.addPropertyOverride(
      'collectionName',
      [props.collectionName!, props.branchName!].join('-')
    );
    customGeofenceCollection.addPropertyOverride(
      'region',
      regionMapping.findInMap(
        cdk.Stack.of(this).region,
        'locationServiceRegion'
      )
    );
    customGeofenceCollection.addPropertyOverride('env', props.branchName!);
    customGeofenceCollection.cfnOptions.deletionPolicy =
      cdk.CfnDeletionPolicy.DELETE;

    const storeLocatorAdminGeofenceCollectionPolicy = new iam.CfnPolicy(
      this,
      'storeLocatorAdminGeofenceCollectionPolicy',
      {
        policyDocument: {
          Statement: [
            {
              Action: [
                'geo:GetGeofence',
                'geo:PutGeofence',
                'geo:BatchPutGeofence',
                'geo:BatchDeleteGeofence',
                'geo:ListGeofences',
              ],
              Effect: 'Allow',
              Resource: `arn:aws:geo:${regionMapping.findInMap(
                cdk.Stack.of(this).region,
                'locationServiceRegion'
              )}:${
                cdk.Stack.of(this).account
              }:geofence-collection/${customGeofenceCollection
                .getAtt('CollectionName')
                .toString()}`,
            },
          ],
          Version: '2012-10-17',
        },
        policyName: [
          'storeLocatorAdmin',
          [props.collectionName!, props.branchName!].join('-'),
          'Policy',
        ].join(''),
        roles: [props.authuserPoolGroupsstoreLocatorAdminGroupRole!],
      }
    );

    // Outputs
    this.name = customGeofenceCollection.getAtt('CollectionName').toString();
    new cdk.CfnOutput(this, 'CfnOutputName', {
      key: 'Name',
      value: this.name!.toString(),
    });
    this.region = regionMapping.findInMap(
      cdk.Stack.of(this).region,
      'locationServiceRegion'
    );
    new cdk.CfnOutput(this, 'CfnOutputRegion', {
      key: 'Region',
      value: this.region!.toString(),
    });
    this.arn = `arn:aws:geo:${regionMapping.findInMap(
      cdk.Stack.of(this).region,
      'locationServiceRegion'
    )}:${
      cdk.Stack.of(this).account
    }:geofence-collection/${customGeofenceCollection
      .getAtt('CollectionName')
      .toString()}`;
    new cdk.CfnOutput(this, 'CfnOutputArn', {
      key: 'Arn',
      value: this.arn!.toString(),
    });
  }
}
