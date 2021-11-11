import * as fs from 'fs-extra';
import { Kind, parse, print, visit } from 'graphql';
import { migrateKeys } from './migrators/key';
import { migrateAuth } from './migrators/auth';
import { migrateConnection } from './migrators/connection';
import { combineSchemas, getDefaultAuth, replaceFile, SchemaDocument } from './utils';
import { DocumentNode } from 'graphql/language';
import { printer, prompter } from 'amplify-prompts';
import * as path from 'path';
import {
  detectCustomRootTypes,
  detectDeprecatedConnectionUsage,
  detectOverriddenResolvers,
  detectPassthroughDirectives,
  graphQLUsingSQL,
  isImprovedPluralizationEnabled,
  isTransformerV2Enabled,
} from './schema-inspector';
import { validateModelSchema, SchemaValidationError } from '@aws-amplify/graphql-transformer-core';
import { revertTransformerVersion, updateTransformerVersion } from './state-migrator';
import { GRAPHQL_DIRECTIVES_SCHEMA } from './constants/graphql-directives';
import * as os from 'os';
import { backupLocation, backupSchemas, doesBackupExist, restoreSchemas } from './schema-backup';
import * as glob from 'glob';

const cliToMigratorAuthMap: Map<string, string> = new Map<string, string>([
  ['API_KEY', 'apiKey'],
  ['AWS_IAM', 'iam'],
  ['AMAZON_COGNITO_USER_POOLS', 'userPools'],
  ['OPENID_CONNECT', 'oidc'],
]);

const MIGRATION_DOCS_URL = 'https://docs.amplify.aws/cli/migration/transformer-migration/';

export async function attemptV2TransformerMigration(resourceDir: string, apiName: string, envName?: string): Promise<void> {
  const schemaDocs = await getSchemaDocs(resourceDir);
  const fullSchema = combineSchemas(schemaDocs);
  const autoMigrationDetectionResult = await canAutoMigrate(fullSchema, apiName, resourceDir);
  const postMigrationStatusMessage = await getPostMigrationStatusMessage(fullSchema, apiName);

  if (typeof autoMigrationDetectionResult === 'string') {
    printer.info(autoMigrationDetectionResult);
    return;
  }

  const defaultAuth = await getDefaultAuth();
  const authMode = cliToMigratorAuthMap.get(defaultAuth);
  if (!authMode) {
    throw Error(`Unidentified authorization mode for API found: ${defaultAuth}`);
  }

  try {
    await backupSchemas(resourceDir);
    await runMigration(schemaDocs, authMode);
    await updateTransformerVersion(envName);
  } catch (error) {
    printer.error('Error encountered migrating schemas');
    printer.info('Restoring original schemas');
    try {
      await runRevert(resourceDir, envName);
    } catch (undoError) {
      printer.error('Error encountered restoring original schemas:');
      printer.info(error);
    }
    throw error;
  }
  printer.success('Automatic migration complete!');
  printer.info(`Original schemas are backed up at ${backupLocation(resourceDir)}`);
  printer.info(postMigrationStatusMessage);
  printer.info(`More migration instructions can be found at ${MIGRATION_DOCS_URL}`);
  printer.info(`To revert the migration run 'amplify migrate api --revert'`);
}

export async function revertV2Migration(resourceDir: string, envName: string) {
  if (!doesBackupExist(resourceDir)) {
    printer.error(`No backup found at ${backupLocation(resourceDir)}`);
    return;
  }
  printer.warn(
    'Reverting migration will restore all schemas to their state before `amplify migrate api`. This will wipe out any schema changes you have made since migrating.',
  );
  if (!(await prompter.confirmContinue())) {
    return;
  }
  await runRevert(resourceDir, envName);
}

export async function runMigration(schemas: SchemaDocument[], authMode: string): Promise<void> {
  const schemaList = schemas.map(doc => doc.schema);

  const fullSchema = schemaList.join('\n');
  const fullSchemaNode = parse(fullSchema);
  doSchemaValidation(fullSchema);

  const newSchemaList: SchemaDocument[] = new Array<SchemaDocument>();
  for (const doc of schemas) {
    const newSchema = await migrateGraphQLSchema(doc.schema, authMode, fullSchemaNode);
    newSchemaList.push({ schema: newSchema, filePath: doc.filePath });
  }

  await Promise.all(newSchemaList.map(doc => replaceFile(doc.schema, doc.filePath)));
}

/**
 * Exported for testing
 */
export function migrateGraphQLSchema(schema: string, authMode: string, massSchema: DocumentNode): string {
  let output = parse(schema);
  visit(output, {
    ObjectTypeDefinition: {
      enter(node) {
        migrateKeys(node);
        migrateAuth(node, authMode);
        migrateConnection(node, massSchema);
        return node;
      },
    },
  });

  return print(output);
}

async function runRevert(resourceDir: string, envName?: string) {
  await restoreSchemas(resourceDir);
  await revertTransformerVersion(envName);
}

function doSchemaValidation(schema: string) {
  const appendedSchema = schema + GRAPHQL_DIRECTIVES_SCHEMA;
  const parsedSchema = parse(appendedSchema);

  let allModelDefinitions = [...parsedSchema.definitions];
  const errors = validateModelSchema({ kind: Kind.DOCUMENT, definitions: allModelDefinitions });
  if (errors && errors.length) {
    throw new SchemaValidationError(errors);
  }
}

async function getSchemaDocs(resourceDir: string): Promise<SchemaDocument[]> {
  const schemaFilePath = path.join(resourceDir, 'schema.graphql');
  const schemaDirectoryPath = path.join(resourceDir, 'schema');
  const schemaFileExists = fs.existsSync(schemaFilePath);
  const schemaDirectoryExists = fs.existsSync(schemaDirectoryPath);

  if (!schemaFileExists && !schemaDirectoryExists) {
    return [];
  }
  if (schemaFileExists) {
    return [{ schema: await fs.readFile(schemaFilePath, 'utf8'), filePath: schemaFilePath }];
  } else if (schemaDirectoryExists) {
    const schemaFiles = glob.sync('**/*.graphql', { cwd: schemaDirectoryPath }).map(fileName => path.join(schemaDirectoryPath, fileName));
    return await Promise.all(schemaFiles.map(async fileName => ({ schema: await fs.readFile(fileName, 'utf8'), filePath: fileName })));
  }
  return [];
}

// returns true if the project can be auto-migrated to v2, or a message explaining why the project cannot be auto-migrated
async function canAutoMigrate(fullSchema: string, apiName: string, resourceDir: string): Promise<true | string> {
  if (graphQLUsingSQL(apiName)) {
    return 'GraphQL APIs using Aurora RDS cannot be migrated.';
  }
  if (isTransformerV2Enabled()) {
    return 'GraphQL Transformer version 2 is already enabled. No migration is necessary.';
  }
  if (detectDeprecatedConnectionUsage(fullSchema)) {
    return 'You are using the deprecated parameterization of @connection which cannot be automatically migrated.';
  }
  if (doesBackupExist(resourceDir)) {
    return `A schema backup already exists at ${backupLocation(resourceDir)}. Remove or copy these files to a different location.`;
  }
  return true;
}

async function getPostMigrationStatusMessage(fullSchema: string, apiName: string): Promise<string> {
  const usingCustomRootTypes = detectCustomRootTypes(parse(fullSchema));
  const usingOverriddenResolvers = detectOverriddenResolvers(apiName);
  const improvedPluralizationEnabled = isImprovedPluralizationEnabled();
  const passthroughDirectives: Array<string> = await detectPassthroughDirectives(fullSchema);
  if (!usingCustomRootTypes && !usingOverriddenResolvers && passthroughDirectives.length === 0 && improvedPluralizationEnabled) {
    return '';
  }
  const messageLines = [
    'The following project state(s) were detected which may need additional attention to ensure they continue to work as expected with the new GraphQL transformer',
  ];
  if (usingCustomRootTypes) {
    messageLines.push('- You have defined custom Queries, Mutations, and/or Subscriptions in your GraphQL schema');
  }
  if (usingOverriddenResolvers) {
    messageLines.push('- You have overridden an Amplify generated resolver');
  }
  if (passthroughDirectives.length > 0) {
    messageLines.push(
      `- You are using the following directives which are not handled by the transformer:${os.EOL}\t${passthroughDirectives.join(', ')}`,
    );
  }
  if (!improvedPluralizationEnabled) {
    messageLines.push('- You do not have the "improvePluralization" Feature Flag enabled');
  }
  return messageLines.join(os.EOL);
}
