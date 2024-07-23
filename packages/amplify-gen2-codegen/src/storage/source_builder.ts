import ts from 'typescript';
import { getAccessPatterns } from './access';
import { renderResourceTsFile } from '../resource/resource';
const factory = ts.factory;
export type S3TriggerDefinition = Record<string, never>;
export type Permission = 'read' | 'write' | 'create' | 'delete';
export type GroupPermissions<G extends readonly string[]> = {
  [Key in G[number]]: Permission[];
};

export type AccessPatterns = {
  auth?: Permission[];
  guest?: Permission[];
  groups?: Record<string, Permission[]>;
};

export interface StorageRenderParameters {
  accessPatterns?: AccessPatterns;
  storageIdentifier?: string;
  lambdas?: S3TriggerDefinition[];
  bucketEncryptionAlgorithm?: string;
}
export const renderStorage = (storageParams: StorageRenderParameters = {}) => {
  const propertyAssignments: ts.PropertyAssignment[] = [];

  if (storageParams.storageIdentifier) {
    propertyAssignments.push(
      factory.createPropertyAssignment(factory.createIdentifier('name'), factory.createStringLiteral(storageParams.storageIdentifier)),
    );
  }
  if (storageParams.accessPatterns) {
    propertyAssignments.push(getAccessPatterns(storageParams.accessPatterns));
  }
  const groupsComment = [];
  if (storageParams.accessPatterns?.groups) {
    groupsComment.push(
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
  const storageArgs = factory.createObjectLiteralExpression(propertyAssignments);
  return renderResourceTsFile({
    importedPackageName: '@aws-amplify/backend',
    backendFunctionConstruct: 'defineStorage',
    exportedVariableName: factory.createIdentifier('storage'),
    functionCallParameter: storageArgs,
    postImportStatements: groupsComment,
  });
};
