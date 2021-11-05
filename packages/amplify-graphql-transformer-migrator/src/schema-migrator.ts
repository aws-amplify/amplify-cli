import * as fs from 'fs-extra';
import { Kind, parse, print, visit } from 'graphql';
import { migrateKeys } from './migrators/key';
import { migrateAuth } from './migrators/auth';
import { migrateConnection } from './migrators/connection';
import {
  backupSchema,
  combineSchemas,
  getDefaultAuthFromContext,
  readSchemaDocuments,
  readSingleFileSchema,
  replaceFile,
  SchemaDocument,
  undoAllSchemaMigration,
} from './utils';
import { DocumentNode } from 'graphql/language';
import { printer } from 'amplify-prompts';
import * as path from 'path';
import { $TSContext } from 'amplify-cli-core';
import {
  detectCustomRootTypes,
  detectDeprecatedConnectionUsage,
  detectOverriddenResolvers,
  detectUnsupportedDirectives as detectPassthroughDirectives,
  graphQLUsingSQL,
  isImprovedPluralizationEnabled,
} from './schema-inspector';
import { validateModelSchema, SchemaValidationError } from '@aws-amplify/graphql-transformer-core';
import { updateTransformerVersion } from './state-migrator';
import { GRAPHQL_DIRECTIVES_SCHEMA } from './constants/graphql-directives';
import * as os from 'os';

const cliToMigratorAuthMap: Map<string, string> = new Map<string, string>([
  ['API_KEY', 'apiKey'],
  ['AWS_IAM', 'iam'],
  ['AMAZON_COGNITO_USER_POOLS', 'userPools'],
  ['OPENID_CONNECT', 'oidc'],
]);

const MIGRATION_DOCS_URL = '<insert migration docs URL here>';

export async function attemptV2TransformerMigration(resourceDir: string, apiName: string, context: $TSContext): Promise<void> {
  const schemaDocs = await getSchemaDocs(resourceDir);
  const fullSchema = combineSchemas(schemaDocs);
  const autoMigrationDetectionResult = await canAutoMigrate(fullSchema, apiName);
  const statusMessage = await getMigrationStatusMessage(fullSchema, apiName);

  if (typeof autoMigrationDetectionResult === 'string') {
    printer.info(autoMigrationDetectionResult);
    return;
  }
  await migrateToV2Transformer(resourceDir, context, schemaDocs);
  printer.info(statusMessage);
  printer.info(`More migration instructions can be found at ${MIGRATION_DOCS_URL}`);
}

export async function runMigration(schemas: SchemaDocument[], authMode: string, envName: string): Promise<void> {
  const schemaList: Array<string> = new Array<string>();
  const backupSchemaPromiseArray: Array<Promise<void>> = new Array<Promise<void>>();
  schemas.forEach(doc => {
    schemaList.push(doc.schema);
    backupSchemaPromiseArray.push(backupSchema(doc.filePath));
  });
  await Promise.all(backupSchemaPromiseArray);

  const fullSchema = schemaList.join('\n');
  const fullSchemaNode = parse(fullSchema);
  doSchemaValidation(fullSchema);

  const newSchemaList: SchemaDocument[] = new Array<SchemaDocument>();
  for (const doc of schemas) {
    const newSchema = await migrateGraphQLSchema(doc.schema, authMode, fullSchemaNode);
    newSchemaList.push({ schema: newSchema, filePath: doc.filePath });
  }

  await Promise.all(newSchemaList.map(doc => replaceFile(doc.schema, doc.filePath)));
  await updateTransformerVersion(envName);

  printer.success('Automatic migration complete!');
  printer.info('Your original schemas are backed up at <TODO path>');
}

/**
 * Exported for testing
 */
export function migrateGraphQLSchema(schema: string, authMode: string, massSchema: DocumentNode): string {
  doSchemaValidation(schema);
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

async function migrateToV2Transformer(resourceDir: string, context: $TSContext, schemaDocs: SchemaDocument[]): Promise<boolean> {
  const { envName } = context.amplify.getEnvInfo();
  const defaultAuth = await getDefaultAuthFromContext();
  const authMode = cliToMigratorAuthMap.get(defaultAuth);
  if (!authMode) {
    throw Error(`Unidentified authorization mode for API found: ${defaultAuth}`);
  }

  try {
    await runMigration(schemaDocs, authMode, envName);
  } catch (error) {
    printer.error('Encountered an error while migrating schema to V2 transformer, reverting to old schemas');
    try {
      await undoAllSchemaMigration(resourceDir);
    } catch (undoError) {
      printer.error('Encountered error while reverting schema migration changes: ');
      printer.error(undoError.message);
    }
    throw error;
  }
  return true;
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
    return await readSingleFileSchema(schemaFilePath);
  } else if (schemaDirectoryExists) {
    return await readSchemaDocuments(schemaDirectoryPath);
  }
  return [];
}

// returns true if the project can be auto-migrated to v2, or a message explaining why the project cannot be auto-migrated
async function canAutoMigrate(fullSchema: string, apiName: string): Promise<true | string> {
  if (graphQLUsingSQL(apiName)) {
    return 'GraphQL APIs using Aurora RDS cannot be migrated.';
  }
  if (detectDeprecatedConnectionUsage(fullSchema)) {
    return 'You are using the deprecated parameterization of @connection which cannot be automatically migrated.';
  }
}

async function getMigrationStatusMessage(fullSchema: string, apiName: string): Promise<string> {
  const usingCustomRootTypes = detectCustomRootTypes(parse(fullSchema));
  const usingOverriddenResolvers = detectOverriddenResolvers(apiName);
  const improvedPluralizationEnabled = isImprovedPluralizationEnabled();
  const unsupportedDirectives: Array<string> = await detectPassthroughDirectives(fullSchema);
  if (!usingCustomRootTypes && !usingOverriddenResolvers && unsupportedDirectives.length === 0 && improvedPluralizationEnabled) {
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
  if (unsupportedDirectives.length > 0) {
    messageLines.push(
      `- You are using the following directives which are not handled by the transformer:${os.EOL}\t${unsupportedDirectives.join(', ')}`,
    );
  }
  if (!improvedPluralizationEnabled) {
    messageLines.push('- You do not have the "improvePluralization" Feature Flag enabled');
  }
  return messageLines.join(os.EOL);
}
