import { AttributeType, BillingMode, StreamViewType, Table, TableEncryption } from '@aws-cdk/aws-dynamodb';
import * as cdk from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import { ResourceConstants, SyncResourceIDs } from 'graphql-transformer-common';
import { TransformerContext } from '../transformer-context';
import { ResolverConfig, SyncConfig, SyncConfigLambda } from '../config/transformer-config';
import {
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';

type DeltaSyncConfig = {
  DeltaSyncTableName: any;
  DeltaSyncTableTTL: number;
  BaseTableTTL: number;
};

export function createSyncTable(context: TransformerContext) {
  const stack = context.stackManager.getStackFor(SyncResourceIDs.syncTableName);
  const tableName = context.resourceHelper.generateResourceName(SyncResourceIDs.syncTableName);
  // eslint-disable-next-line no-new
  new Table(stack, SyncResourceIDs.syncTableName, {
    tableName,
    partitionKey: {
      name: SyncResourceIDs.syncPrimaryKey,
      type: AttributeType.STRING,
    },
    sortKey: {
      name: SyncResourceIDs.syncRangeKey,
      type: AttributeType.STRING,
    },
    stream: StreamViewType.NEW_AND_OLD_IMAGES,
    encryption: TableEncryption.DEFAULT,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    billingMode: BillingMode.PAY_PER_REQUEST,
    timeToLiveAttribute: '_ttl',
  });

  createSyncIAMRole(context, stack, tableName);
}

function createSyncIAMRole(context: TransformerContext, stack: cdk.Stack, tableName: string) {
  const role = new iam.Role(stack, SyncResourceIDs.syncIAMRoleName, {
    roleName: context.resourceHelper.generateIAMRoleName(SyncResourceIDs.syncIAMRoleName),
    assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
  });

  role.attachInlinePolicy(
    new iam.Policy(stack, 'DynamoDBAccess', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'dynamodb:BatchGetItem',
            'dynamodb:BatchWriteItem',
            'dynamodb:PutItem',
            'dynamodb:DeleteItem',
            'dynamodb:GetItem',
            'dynamodb:Scan',
            'dynamodb:Query',
            'dynamodb:UpdateItem',
          ],
          resources: [
            // eslint-disable-next-line no-template-curly-in-string
            cdk.Fn.sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${tablename}', {
              tablename: tableName,
            }),
            // eslint-disable-next-line no-template-curly-in-string
            cdk.Fn.sub('arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${tablename}/*', {
              tablename: tableName,
            }),
          ],
        }),
      ],
    }),
  );
}

export function syncDataSourceConfig(): DeltaSyncConfig {
  return {
    DeltaSyncTableName: joinWithEnv('-', [
      SyncResourceIDs.syncTableName,
      cdk.Fn.getAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
    ]),
    DeltaSyncTableTTL: 30,
    BaseTableTTL: 43200, // 30 days
  };
}

export function validateResolverConfigForType(ctx: TransformerSchemaVisitStepContextProvider, typeName: string): void {
  const resolverConfig = ctx.getResolverConfig<ResolverConfig>();
  const typeResolverConfig = resolverConfig?.models?.[typeName];
  if (!typeResolverConfig || !typeResolverConfig.ConflictDetection || !typeResolverConfig.ConflictHandler) {
    console.warn(`Invalid resolverConfig for type ${typeName}. Using the project resolverConfig instead.`);
  }
}

export function getSyncConfig(ctx: TransformerTransformSchemaStepContextProvider, typeName: string): SyncConfig | undefined {
  let syncConfig: SyncConfig | undefined;

  const resolverConfig = ctx.getResolverConfig<ResolverConfig>();
  syncConfig = resolverConfig?.project;

  const typeResolverConfig = resolverConfig?.models?.[typeName];
  if (typeResolverConfig && typeResolverConfig.ConflictDetection && typeResolverConfig.ConflictHandler) {
    syncConfig = typeResolverConfig;
  }

  return syncConfig;
}

export function isLambdaSyncConfig(syncConfig: SyncConfig): syncConfig is SyncConfigLambda {
  const lambdaConfigKey: keyof SyncConfigLambda = 'LambdaConflictHandler';
  if (syncConfig && syncConfig.ConflictHandler === 'LAMBDA') {
    if (syncConfig.hasOwnProperty(lambdaConfigKey)) {
      return true;
    }
    throw Error(`Invalid Lambda SyncConfig`);
  }
  return false;
}

export function createSyncLambdaIAMPolicy(stack: cdk.Stack, name: string, region?: string): iam.Policy {
  return new iam.Policy(stack, 'InvokeLambdaFunction', {
    statements: [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['lambda:InvokeFunction'],
        resources: [syncLambdaArnResource(name, region)],
      }),
    ],
  });
}

function syncLambdaArnResource(name: string, region?: string): string {
  const substitutions = {};
  if (referencesEnv(name)) {
    Object.assign(substitutions, {
      env: cdk.Fn.ref(ResourceConstants.PARAMETERS.Env),
    });
  }
  return cdk.Fn.conditionIf(
    ResourceConstants.CONDITIONS.HasEnvironmentParameter,
    cdk.Fn.sub(lambdaArnKey(name, region), substitutions),
    cdk.Fn.sub(lambdaArnKey(removeEnvReference(name), region), {}),
  ).toString();
}

function referencesEnv(value: string): boolean {
  return value.match(/(\${env})/) !== null;
}

function lambdaArnKey(name: string, region?: string): string {
  return region
    ? `arn:aws:lambda:${region}:\${AWS::AccountId}:function:${name}`
    : `arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:function:${name}`;
}

function removeEnvReference(value: string): string {
  return value.replace(/(-\${env})/, '');
}

function joinWithEnv(separator: string, listToJoin: any[]) {
  return cdk.Fn.conditionIf(
    ResourceConstants.CONDITIONS.HasEnvironmentParameter,
    cdk.Fn.join(separator, [...listToJoin, cdk.Fn.ref(ResourceConstants.PARAMETERS.Env)]),
    cdk.Fn.join(separator, listToJoin),
  );
}
