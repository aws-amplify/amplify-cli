import ts, { VariableDeclaration, VariableStatement } from 'typescript';
import { getAccessPatterns } from './access';
import { renderResourceTsFile } from '../../resource/resource';
import { createTriggersProperty, Lambda } from '../functions/lambda';
import type { BucketAccelerateStatus, BucketVersioningStatus, ServerSideEncryptionByDefault } from '@aws-sdk/client-s3';
const factory = ts.factory;

const amplifyGen1EnvName = 'AMPLIFY_GEN_1_ENV_NAME';

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

export interface StorageRenderParameters {
  bucketName?: string;
  triggers?: Partial<Record<StorageTriggerEvent, Lambda>>;
  accessPatterns?: AccessPatterns;
  storageIdentifier?: string;
  lambdas?: S3TriggerDefinition[];
  bucketEncryptionAlgorithm?: ServerSideEncryptionConfiguration;
  dynamoDB?: string;
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
  namedImports['@aws-amplify/backend'].add('defineStorage');
  const triggers = storageParams.triggers || {};

  const postImportStatements = [];
  const amplifyGen1EnvStatement = createVariableStatement(
    factory.createVariableDeclaration(
      amplifyGen1EnvName,
      undefined,
      undefined,
      factory.createIdentifier('process.env.AMPLIFY_GEN_1_ENV_NAME ?? "sandbox"'),
    ),
  );
  postImportStatements.push(amplifyGen1EnvStatement);

  if (storageParams.storageIdentifier) {
    const splitStorageIdentifier = storageParams.storageIdentifier.split('-');
    const storageNameWithoutBackendEnvName = splitStorageIdentifier.slice(0, -1).join('-');

    const storageNameAssignment = createTemplateLiteral(`${storageNameWithoutBackendEnvName}-`, amplifyGen1EnvName, '');
    propertyAssignments.push(factory.createPropertyAssignment(factory.createIdentifier('name'), storageNameAssignment));
  }
  if (storageParams.accessPatterns) {
    propertyAssignments.push(getAccessPatterns(storageParams.accessPatterns));
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
      if (!namedImports[`./${functionName}/resource`]) {
        namedImports[`./${functionName}/resource`] = new Set();
      }
      namedImports[`./${functionName}/resource`].add(functionName);
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
