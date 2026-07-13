import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface geostoreLocatorSearchProps {
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
  readonly indexName: string;
  /**
   */
  readonly dataProvider: string;
  /**
   */
  readonly dataSourceIntendedUse: string;
  /**
   */
  readonly isDefault: string;
  /**
   */
  readonly branchName: string;
}

/**
 * {"createdOn":"Mac","createdBy":"Amplify","createdWith":"14.3.0","stackType":"geo-PlaceIndex","metadata":{"whyContinueWithGen1":"Prefer not to answer"}}
 */
export class geostoreLocatorSearch extends Construct {
  public readonly name;
  public readonly region;
  public readonly arn;

  public constructor(
    scope: Construct,
    id: string,
    props: geostoreLocatorSearchProps
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
    const customPlaceIndexLambdaServiceRoleFd2f3c9d = new iam.CfnRole(
      this,
      'CustomPlaceIndexLambdaServiceRoleFD2F3C9D',
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

    const customPlaceIndexLambdaServiceRoleDefaultPolicy818068B1 =
      new iam.CfnPolicy(
        this,
        'CustomPlaceIndexLambdaServiceRoleDefaultPolicy818068B1',
        {
          policyDocument: {
            Statement: [
              {
                Action: 'geo:CreatePlaceIndex',
                Effect: 'Allow',
                Resource: '*',
              },
              {
                Action: ['geo:UpdatePlaceIndex', 'geo:DeletePlaceIndex'],
                Effect: 'Allow',
                Resource: `arn:aws:geo:${regionMapping.findInMap(
                  cdk.Stack.of(this).region,
                  'locationServiceRegion'
                )}:${cdk.Stack.of(this).account}:place-index/${[
                  props.indexName!,
                  props.branchName!,
                ].join('-')}`,
              },
            ],
            Version: '2012-10-17',
          },
          policyName: 'CustomPlaceIndexLambdaServiceRoleDefaultPolicy818068B1',
          roles: [customPlaceIndexLambdaServiceRoleFd2f3c9d.ref],
        }
      );

    const customPlaceIndexLambda79813Bb9 = new lambda.CfnFunction(
      this,
      'CustomPlaceIndexLambda79813BB9',
      {
        code: {
          zipFile:
            "const response = require('cfn-response');\nconst { LocationClient, CreatePlaceIndexCommand, DeletePlaceIndexCommand, UpdatePlaceIndexCommand } = require('@aws-sdk/client-location');\nexports.handler = async function (event, context) {\n  try {\n    console.log('REQUEST RECEIVED:' + JSON.stringify(event));\n    const pricingPlan = 'RequestBasedUsage';\n    if (event.RequestType === 'Create') {\n      const params = {\n        IndexName: event.ResourceProperties.indexName,\n        DataSource: event.ResourceProperties.dataSource,\n        DataSourceConfiguration: {\n          IntendedUse: event.ResourceProperties.dataSourceIntendedUse,\n        },\n        PricingPlan: pricingPlan,\n      };\n      const locationClient = new LocationClient({ region: event.ResourceProperties.region });\n      const res = await locationClient.send(new CreatePlaceIndexCommand(params));\n      console.log('create resource response data' + JSON.stringify(res));\n      if (res.IndexName && res.IndexArn) {\n        event.PhysicalResourceId = res.IndexName;\n        await response.send(event, context, response.SUCCESS, res, params.IndexName);\n      } else {\n        await response.send(event, context, response.FAILED, res, params.IndexName);\n      }\n    }\n    if (event.RequestType === 'Update') {\n      const params = {\n        IndexName: event.ResourceProperties.indexName,\n        DataSourceConfiguration: {\n          IntendedUse: event.ResourceProperties.dataSourceIntendedUse,\n        },\n        PricingPlan: pricingPlan,\n      };\n      const locationClient = new LocationClient({ region: event.ResourceProperties.region });\n      const res = await locationClient.send(new UpdatePlaceIndexCommand(params));\n      console.log('update resource response data' + JSON.stringify(res));\n      if (res.IndexName && res.IndexArn) {\n        event.PhysicalResourceId = res.IndexName;\n        await response.send(event, context, response.SUCCESS, res, params.IndexName);\n      } else {\n        await response.send(event, context, response.FAILED, res, params.IndexName);\n      }\n    }\n    if (event.RequestType === 'Delete') {\n      const params = {\n        IndexName: event.ResourceProperties.indexName,\n      };\n      const locationClient = new LocationClient({ region: event.ResourceProperties.region });\n      const res = await locationClient.send(new DeletePlaceIndexCommand(params));\n      event.PhysicalResourceId = event.ResourceProperties.indexName;\n      console.log('delete resource response data' + JSON.stringify(res));\n      await response.send(event, context, response.SUCCESS, res, params.IndexName);\n    }\n  } catch (err) {\n    console.log(err.stack);\n    const res = { Error: err };\n    await response.send(event, context, response.FAILED, res, event.ResourceProperties.indexName);\n    throw err;\n  }\n};\n",
        },
        handler: 'index.handler',
        role: customPlaceIndexLambdaServiceRoleFd2f3c9d.attrArn,
        runtime: 'nodejs22.x',
        timeout: 300,
      }
    );
    customPlaceIndexLambda79813Bb9.addDependency(
      customPlaceIndexLambdaServiceRoleDefaultPolicy818068B1
    );
    customPlaceIndexLambda79813Bb9.addDependency(
      customPlaceIndexLambdaServiceRoleFd2f3c9d
    );

    const customPlaceIndex = new cdk.CfnCustomResource(
      this,
      'CustomPlaceIndex',
      {
        serviceToken: customPlaceIndexLambda79813Bb9.attrArn,
      }
    );
    customPlaceIndex.addOverride('Type', 'Custom::LambdaCallout');
    customPlaceIndex.addPropertyOverride(
      'indexName',
      [props.indexName!, props.branchName!].join('-')
    );
    customPlaceIndex.addPropertyOverride('dataSource', props.dataProvider!);
    customPlaceIndex.addPropertyOverride(
      'dataSourceIntendedUse',
      props.dataSourceIntendedUse!
    );
    customPlaceIndex.addPropertyOverride(
      'region',
      regionMapping.findInMap(
        cdk.Stack.of(this).region,
        'locationServiceRegion'
      )
    );
    customPlaceIndex.addPropertyOverride('env', props.branchName!);
    customPlaceIndex.cfnOptions.deletionPolicy = cdk.CfnDeletionPolicy.DELETE;

    const placeIndexPolicy = new iam.CfnPolicy(this, 'PlaceIndexPolicy', {
      policyDocument: {
        Statement: [
          {
            Action: [
              'geo:SearchPlaceIndexForPosition',
              'geo:SearchPlaceIndexForText',
              'geo:SearchPlaceIndexForSuggestions',
              'geo:GetPlace',
            ],
            Effect: 'Allow',
            Resource: customPlaceIndex.getAtt('IndexArn').toString(),
          },
        ],
        Version: '2012-10-17',
      },
      policyName: [
        [props.indexName!, props.branchName!].join('-'),
        'Policy',
      ].join(''),
      roles: [
        props.authRoleName!,
        props.unauthRoleName!,
        props.authuserPoolGroupsstoreLocatorAdminGroupRole!,
      ],
    });

    // Outputs
    this.name = customPlaceIndex.getAtt('IndexName').toString();
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
    this.arn = customPlaceIndex.getAtt('IndexArn').toString();
    new cdk.CfnOutput(this, 'CfnOutputArn', {
      key: 'Arn',
      value: this.arn!.toString(),
    });
  }
}
