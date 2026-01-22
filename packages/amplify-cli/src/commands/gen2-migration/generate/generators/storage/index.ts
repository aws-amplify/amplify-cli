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
  /** Function access patterns for resource-based access */
  functions?: Array<{
    functionName: string;
    permissions: Permission[];
  }>;
};

export type ServerSideEncryptionConfiguration = {
  serverSideEncryptionByDefault: ServerSideEncryptionByDefault;
  bucketKeyEnabled: boolean;
};

export interface StorageRenderParameters {
  bucketName?: string;
  triggers?: Partial<Record<StorageTriggerEvent, Lambda>>;
  accessPatterns?: AccessPatterns;
  storageIdentifier?: string;
  lambdas?: S3TriggerDefinition[];
  bucketEncryptionAlgorithm?: ServerSideEncryptionConfiguration;
  // Dynamic import since it can cause a circular dependency otherwise. Needed since the interface contains this property
  dynamoTables?: import('../../adapters/storage').DynamoDBTableDefinition[];
  dynamoFunctionAccess?: import('../../adapters/storage').FunctionDynamoDBAccess[];
  accelerateConfiguration?: BucketAccelerateStatus;
  versioningConfiguration?: BucketVersioningStatus;
  functionNamesAndCategories?: Map<string, string>;
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
  namedImports['@aws-amplify/backend'].add('defineStorage');
  const triggers = storageParams.triggers || {};

  const postImportStatements = [];

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

    // s3Bucket.bucketName = '<gen1-bucket-name>'

    propertyAssignments.push(nameProperty);
  }
  if (storageParams.accessPatterns) {
    propertyAssignments.push(getAccessPatterns(storageParams.accessPatterns));

    // Add function imports if function access patterns are present
    if (storageParams.accessPatterns.functions && storageParams.accessPatterns.functions.length > 0) {
      for (const functionAccess of storageParams.accessPatterns.functions) {
        const functionCategory = storageParams.functionNamesAndCategories?.get(functionAccess.functionName) || 'function';
        const functionImportPath = `../${functionCategory}/${functionAccess.functionName}/resource`;
        if (!namedImports[functionImportPath]) {
          namedImports[functionImportPath] = new Set();
        }
        namedImports[functionImportPath].add(functionAccess.functionName);
      }
    }
  }
  if (storageParams.accessPatterns?.groups) {
    postImportStatements.push(
      factory.createJSDocComment(
        factory.createNodeArray([
          factory.createJSDocText('TODO: Your project uses group permissions. Group permissions have changed in Gen 2. '),
          factory.createJSDocText(
            'In order to grant permissions to groups in Gen 2, please refer to https://docs.amplify.aws/react/build-a-backend/storage/authorization/#for-gen-1-public-protected-and-private-access-pattern.',
          ),
        ]),
      ),
    );
  }

  if (Object.keys(triggers).length) {
    propertyAssignments.push(createTriggersProperty(triggers));
    for (const value of Object.values(triggers)) {
      const functionName = value.source.split('/')[3];
      const functionCategory = storageParams.functionNamesAndCategories?.get(functionName) || 'function';
      const functionImportPath =
        functionCategory === 'storage' ? `./${functionName}/resource` : `../${functionCategory}/${functionName}/resource`;
      if (!namedImports[functionImportPath]) {
        namedImports[functionImportPath] = new Set();
      }
      namedImports[functionImportPath].add(functionName);
    }
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
