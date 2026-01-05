import ts, { VariableDeclaration, VariableStatement } from 'typescript';
import { getAccessPatterns } from './access';
import { renderResourceTsFile } from '../../resource/resource';
import { createTriggersProperty, Lambda } from '../functions/lambda';
import type { BucketAccelerateStatus, BucketVersioningStatus, ServerSideEncryptionByDefault } from '@aws-sdk/client-s3';
const factory = ts.factory;

const gen2BranchNameVariableName = 'branchName';

export type S3TriggerDefinition = Record<string, never>;
export type Permission = 'read' | 'write' | 'create' | 'delete';
export type GroupPermissions<G extends readonly string[]> = {
  [Key in G[number]]: Permission[];
};

export type StorageTriggerEvent = 'onDelete' | 'onUpload';
export type AccessPatterns = {
  auth?: Permission[];
  guest?: Permission[];
  groups?: Record<string, Permission[]>;
};

export type ServerSideEncryptionConfiguration = {
  serverSideEncryptionByDefault: ServerSideEncryptionByDefault;
  bucketKeyEnabled: boolean;
};

export type DynamoDBAttribute = {
  name: string;
  type: 'STRING' | 'NUMBER' | 'BINARY';
};

export type DynamoDBGSI = {
  indexName: string;
  partitionKey: DynamoDBAttribute;
  sortKey?: DynamoDBAttribute;
};

export type DynamoDBTableDefinition = {
  tableName: string;
  partitionKey: DynamoDBAttribute;
  sortKey?: DynamoDBAttribute;
  gsis?: DynamoDBGSI[];
  lambdaPermissions?: {
    functionName: string;
    envVarName: string;
  }[];
};

export interface StorageRenderParameters {
  bucketName?: string;
  triggers?: Partial<Record<StorageTriggerEvent, Lambda>>;
  accessPatterns?: AccessPatterns;
  storageIdentifier?: string;
  lambdas?: S3TriggerDefinition[];
  bucketEncryptionAlgorithm?: ServerSideEncryptionConfiguration;
  dynamoDB?: string;
  dynamoTables?: DynamoDBTableDefinition[];
  accelerateConfiguration?: BucketAccelerateStatus;
  versioningConfiguration?: BucketVersioningStatus;
}

const createVariableStatement = (variableDeclaration: VariableDeclaration): VariableStatement => {
  return factory.createVariableStatement([], factory.createVariableDeclarationList([variableDeclaration], ts.NodeFlags.Const));
};

const createTemplateLiteral = (templateHead: string, templateSpan: string, templateTail: string) => {
  return factory.createTemplateExpression(factory.createTemplateHead(templateHead), [
    factory.createTemplateSpan(factory.createIdentifier(templateSpan), factory.createTemplateTail(templateTail)),
  ]);
};

export const renderStorage = (storageParams: StorageRenderParameters = {}) => {
  const propertyAssignments: ts.PropertyAssignment[] = [];
  const namedImports: Record<string, Set<string>> = { '@aws-amplify/backend': new Set() };
  const postImportStatements: ts.Statement[] = [];
  const triggers = storageParams.triggers || {};

  const hasS3 = storageParams.storageIdentifier || storageParams.accessPatterns;
  if (hasS3) {
    namedImports['@aws-amplify/backend'].add('defineStorage');

    const amplifyGen1EnvStatement = createVariableStatement(
      factory.createVariableDeclaration(
        gen2BranchNameVariableName,
        undefined,
        undefined,
        factory.createIdentifier('process.env.AWS_BRANCH ?? "sandbox"'),
      ),
    );
    postImportStatements.push(amplifyGen1EnvStatement);

    if (storageParams.storageIdentifier) {
      const splitStorageIdentifier = storageParams.storageIdentifier.split('-');
      const storageNameWithoutBackendEnvName = splitStorageIdentifier.slice(0, -1).join('-');
      const storageNameAssignment = createTemplateLiteral(`${storageNameWithoutBackendEnvName}-`, gen2BranchNameVariableName, '');
      const nameProperty = factory.createPropertyAssignment(factory.createIdentifier('name'), storageNameAssignment);
      propertyAssignments.push(nameProperty);
    }

    if (storageParams.accessPatterns) {
      propertyAssignments.push(getAccessPatterns(storageParams.accessPatterns));
    }

    if (Object.keys(triggers).length) {
      propertyAssignments.push(createTriggersProperty(triggers));
      for (const value of Object.values(triggers)) {
        const functionName = value.source.split('/')[3];
        if (!namedImports[`./${functionName}/resource`]) {
          namedImports[`./${functionName}/resource`] = new Set();
        }
        namedImports[`./${functionName}/resource`].add(functionName);
      }
    }
  }

  if (storageParams.dynamoTables?.length) {
    const stackDeclaration = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            'storageStack',
            undefined,
            undefined,
            hasS3
              ? factory.createPropertyAccessExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('storage')),
                  factory.createIdentifier('stack'),
                )
              : factory.createCallExpression(
                  factory.createPropertyAccessExpression(factory.createIdentifier('backend'), factory.createIdentifier('createStack')),
                  undefined,
                  [factory.createStringLiteral('storage-stack')],
                ),
          ),
        ],
        ts.NodeFlags.Const,
      ),
    );
    postImportStatements.push(stackDeclaration);
    postImportStatements.push(...renderDynamoTables(storageParams.dynamoTables, namedImports));
  }

  if (hasS3) {
    const storageArgs = factory.createObjectLiteralExpression(propertyAssignments);
    return renderResourceTsFile({
      backendFunctionConstruct: 'defineStorage',
      exportedVariableName: factory.createIdentifier('storage'),
      functionCallParameter: storageArgs,
      postImportStatements,
      additionalImportedBackendIdentifiers: namedImports,
    });
  } else if (storageParams.dynamoTables?.length) {
    return renderResourceTsFile({
      backendFunctionConstruct: '',
      exportedVariableName: factory.createIdentifier('storage'),
      functionCallParameter: factory.createObjectLiteralExpression([]),
      postImportStatements,
      additionalImportedBackendIdentifiers: namedImports,
    });
  }

  const storageArgs = factory.createObjectLiteralExpression(propertyAssignments);
  return renderResourceTsFile({
    backendFunctionConstruct: 'defineStorage',
    exportedVariableName: factory.createIdentifier('storage'),
    functionCallParameter: storageArgs,
    postImportStatements,
    additionalImportedBackendIdentifiers: namedImports,
  });
};
