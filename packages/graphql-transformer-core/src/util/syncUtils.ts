import { DynamoDB, IAM, Fn } from 'cloudform-types';
// import { TimeToLiveSpecification } from 'cloudform-types/types/dynamoDb/table';
// import { DeltaSyncConfig } from 'cloudform-types/types/appSync/dataSource';
// import { SyncConfig } from 'cloudform-types/types/appSync/resolver';
import { SyncResourceIDs, ResourceConstants } from 'graphql-transformer-common';
import { SyncConfigLAMBDA, SyncConfigLRW, SyncConfigSERVER } from './transformConfig';

// Cloudformation Types for AppSync Local
type SyncConfig = {
  ConflictDetection: string;
  ConflictHandler: string;
  LambdaConflictHandlerARN?: string;
};
type DeltaSyncConfig = {
  DeltaSyncTableName: string;
  DeltaSyncTableTTL: number;
  BaseTableTTL: number;
};

export module SyncUtils {
  export function createSyncTable() {
    return new DynamoDB.Table({
      TableName: SyncResourceIDs.syncTableName,
      AttributeDefinitions: [
        {
          AttributeName: SyncResourceIDs.syncPrimaryKey,
          AttributeType: 'S',
        },
        {
          AttributeName: SyncResourceIDs.syncRangeKey,
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: SyncResourceIDs.syncPrimaryKey,
          KeyType: 'HASH',
        },
        {
          AttributeName: SyncResourceIDs.syncRangeKey,
          KeyType: 'RANGE',
        },
      ],
      BillingMode: 'PAY_PER_REQUEST',
      TimeToLiveSpecification: syncTTLConfig(),
    });
  }

  export function createSyncIAMRole() {
    const roleName = SyncResourceIDs.syncIAMRoleName;
    return new IAM.Role({
      RoleName: Fn.If(
        ResourceConstants.CONDITIONS.HasEnvironmentParameter,
        Fn.Join('-', [
          roleName.slice(0, 21), // max of 64. 64-10-26-4-3 = 21
          'role', // 4
          Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'), // 26
          Fn.Ref(ResourceConstants.PARAMETERS.Env), // 10
        ]),
        Fn.Join('-', [
          roleName.slice(0, 31), // max of 64. 64-26-4-3 = 31
          'role',
          Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
        ])
      ),
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'appsync.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      Policies: [
        new IAM.Role.Policy({
          PolicyName: 'DynamoDBAccess',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'dynamodb:BatchGetItem',
                  'dynamodb:BatchWriteItem',
                  'dynamodb:PutItem',
                  'dynamodb:DeleteItem',
                  'dynamodb:GetItem',
                  'dynamodb:Scan',
                  'dynamodb:Query',
                  'dynamodb:UpdateItem',
                ],
                Resource: [
                  Fn.Sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${tablename}', {
                    tablename: SyncResourceIDs.syncTableName,
                  }),
                  Fn.Sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${tablename}/*', {
                    tablename: SyncResourceIDs.syncTableName,
                  }),
                ],
              },
            ],
          },
        }),
      ],
    });
  }
  export function syncLambdaArnResource({ name, region }: { name: string; region?: string }) {
    const env = 'env;';
    const substitutions = {};
    if (referencesEnv(name)) {
      substitutions[env] = Fn.Ref(ResourceConstants.PARAMETERS.Env);
    }
    return Fn.If(
      ResourceConstants.CONDITIONS.HasEnvironmentParameter,
      Fn.Sub(lambdaArnKey(name, region), substitutions),
      Fn.Sub(lambdaArnKey(removeEnvReference(name), region), {})
    );
  }
  export function lambdaArnKey(name: string, region?: string) {
    return region
      ? `arn:aws:lambda:${region}:\${AWS::AccountId}:function:${name}`
      : `arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:function:${name}`;
  }
  function referencesEnv(value: string) {
    return value.match(/(\${env})/) !== null;
  }
  function removeEnvReference(value: string) {
    return value.replace(/(-\${env})/, '');
  }
  export function syncLambdaIAMRole({ name, region }: { name: string; region?: string }) {
    return new IAM.Role({
      RoleName: Fn.If(
        ResourceConstants.CONDITIONS.HasEnvironmentParameter,
        Fn.Join('-', [
          name.slice(0, 26), // max of 64. 64-10-26-28 = 0
          Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'), // 26
          Fn.Ref(ResourceConstants.PARAMETERS.Env), // 10
        ]),
        Fn.Join('-', [
          // tslint:disable-next-line: no-magic-numbers
          name.slice(0, 37), // max of 64. 64-26-38 = 0
          Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'), // 26
        ])
      ),
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'appsync.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      Policies: [
        {
          PolicyName: 'InvokeLambdaFunction',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['lambda:InvokeFunction'],
                Resource: syncLambdaArnResource({ name, region }),
              },
            ],
          },
        },
      ],
    });
  }
  export function syncTTLConfig() {
    return {
      AttributeName: '_ttl',
      Enabled: true,
    };
  }
  export function syncDataSourceConfig(): DeltaSyncConfig {
    return {
      DeltaSyncTableName: SyncResourceIDs.syncTableName,
      DeltaSyncTableTTL: 30,
      BaseTableTTL: 30,
    };
  }
  export function syncResolverConfig(syncConfig: SyncConfigLRW | SyncConfigLAMBDA | SyncConfigSERVER): SyncConfig {
    const resolverObj: SyncConfig = {
      ConflictDetection: syncConfig.ConflictDetection,
      ConflictHandler: syncConfig.ConflictHandler,
    };
    if (isLambdaSyncConfig(syncConfig)) {
      if (!syncConfig.LambdaConflictHandler.lambdaArn) {
        throw Error('Lambda ARN was not configured.');
      }
      resolverObj.LambdaConflictHandlerARN = syncConfig.LambdaConflictHandler.lambdaArn;
    }
    return resolverObj;
  }
  export function isLambdaSyncConfig(obj: any): obj is SyncConfigLAMBDA {
    const lambbdaConfigKey: keyof SyncConfigLAMBDA = 'LambdaConflictHandler';
    if (obj && obj.ConflictHandler === 'LAMBDA') {
      if (obj.hasOwnProperty(lambbdaConfigKey)) {
        return true;
      }
      throw Error(`Invalid Lambda SyncConfig`);
    }
  }
}
