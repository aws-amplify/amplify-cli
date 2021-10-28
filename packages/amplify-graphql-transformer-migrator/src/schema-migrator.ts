import * as fs from 'fs-extra';
import { Kind, parse, print, visit } from 'graphql';
import { migrateKeys } from './migrators/key'
import { migrateAuth } from './migrators/auth'
import { migrateConnection } from './migrators/connection'
import {
  backupSchema, combineSchemas, DiffDocument,
  getDefaultAuthFromContext, getSchemaDiffs,
  readSchemaDocuments,
  readSingleFileSchema,
  replaceFile,
  SchemaDocument,
  undoAllSchemaMigration,
} from './utils';
import { DocumentNode } from 'graphql/language';
import { prompter, printer } from 'amplify-prompts';
import path from 'path';
import { $TSContext, exitOnNextTick, FeatureFlags, pathManager, stateManager } from 'amplify-cli-core';
import { detectCustomResolvers, detectOverriddenResolvers, detectUnsupportedDirectives, graphQLUsingSQL } from './schema-inspector';
import { validateModelSchema, SchemaValidationError } from '@aws-amplify/graphql-transformer-core';
import { updateTransformerVersion } from './state-migrator';
import { GRAPHQL_DIRECTIVES_SCHEMA } from './constants/graphql-directives';

const cliToMigratorAuthMap: Map<string, string> = new Map<string, string>([
  ['API_KEY', 'apiKey'],
  ['AWS_IAM', 'iam'],
  ['AMAZON_COGNITO_USER_POOLS', 'userPools'],
  ['OPENID_CONNECT', 'oidc']
]);

const MIGRATION_URL = "<insert migration docs URL here>";

function doSchemaValidation(schema: string) {
  const appendedSchema = schema + GRAPHQL_DIRECTIVES_SCHEMA;
  const parsedSchema = parse(appendedSchema);

  let allModelDefinitions = [...parsedSchema.definitions];
  const errors = validateModelSchema({ kind: Kind.DOCUMENT, definitions: allModelDefinitions });
  if (errors && errors.length) {
    throw new SchemaValidationError(errors);
  }
}

function showDiffs(diffDocs: DiffDocument[]): void {
  printer.info("Changes made to your schemas:\n");
  for (let doc of diffDocs) {
    printer.info(`File: ${doc.filePath}`);
    printer.info(doc.schemaDiff);
    printer.info("\n");
  }
}

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
      }
    }
  });

  return print(output);
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
  }
  else if (schemaDirectoryExists) {
    return await readSchemaDocuments(schemaDirectoryPath);
  }
  return [];
}

async function runMigration(schemas: SchemaDocument[], authMode: string): Promise<boolean> {
  let fullSchema: string;
  let schemaList: Array<string> = new Array<string>();
  let backupSchemaPromiseArray: Array<Promise<void>> = new Array<Promise<void>>();
  schemas.forEach((doc) => {
    schemaList.push(doc.schema);
    backupSchemaPromiseArray.push(backupSchema(doc.filePath));
  });
  await Promise.all(backupSchemaPromiseArray);

  fullSchema = schemaList.join('\n');
  let fullSchemaNode = parse(fullSchema);
  doSchemaValidation(fullSchema);

  let newSchemaList: SchemaDocument[] = new Array<SchemaDocument>();
  for(let doc of schemas) {
    const newSchema = await migrateGraphQLSchema(doc.schema, authMode, fullSchemaNode);
    newSchemaList.push({ schema: newSchema, filePath: doc.filePath });
  }

  const diffs = getSchemaDiffs(schemas, newSchemaList);
  showDiffs(diffs);

  const migrationChoices: Array<string> = ["Yes", "Yes, but exit the CLI so I can review/edit my new schemas before compiling/pushing",
    "No, continue my operation with my old schemas"];
  const migrationChoice: string = await prompter.pick("Do you want to proceed with the auto-migration?", migrationChoices);
  const migrationIndex: number = migrationChoices.findIndex((value) => {
    return value === migrationChoice;
  });
  if (migrationIndex === -1 || migrationIndex === 2) {
    return false;
  }

  let writeNewPromiseArray: Promise<void>[] = [];
  newSchemaList.forEach((doc) => {
    writeNewPromiseArray.push(replaceFile(doc.schema, doc.filePath));
  });
  await Promise.all(writeNewPromiseArray);

  if (migrationIndex === 1) {
    // Customer has selected to review their new schemas before compiling or pushing
    exitOnNextTick(0);
  }
  printer.info(`Success! Auto-migration completed. Just in case, we've placed a back-up of your old 
GraphQL schema file(s) at these location(s):`);
  for(let schema of schemas) {
    printer.info(`- ${schema.filePath}.bkp`);
  }
  return true;
}

async function migrateToV2Transformer(resourceDir: string, context: $TSContext, schemaDocs: SchemaDocument[]): Promise<boolean> {
  const { envName } = context.amplify.getEnvInfo();
  const defaultAuth = await getDefaultAuthFromContext();
  const authMode = cliToMigratorAuthMap.get(defaultAuth);
  if (!authMode) {
    throw Error(`Unidentified authorization mode for API found: ${defaultAuth}`);
  }

  try {
    await runMigration(schemaDocs, authMode);
    await updateTransformerVersion(envName);
  }
  catch (error) {
    printer.error("Encountered an error while migrating schema to V2 transformer, reverting to old schemas");
    await undoAllSchemaMigration(resourceDir);
    throw error;
  }
  return true;
}


export async function attemptV2TransformerMigration(resourceDir: string, apiName: string, context: $TSContext): Promise<boolean> {
  if (graphQLUsingSQL(apiName)) {
    return false;
  }
  printer.warn(`Amplify CLI made new improvements to GraphQL APIs, such as pipeline 
resolvers support, deny-by-default authorization, improved search and result 
aggregations. Learn all about the new changes and the required migration process 
here: ${MIGRATION_URL}`);
  const schemaDocs = await getSchemaDocs(resourceDir);
  const fullSchema = combineSchemas(schemaDocs);
  const usingCustomResolvers = detectCustomResolvers(parse(fullSchema));
  const usingOverriddenResolvers = detectOverriddenResolvers(apiName);
  const unsupportedDirectives: Array<string> = await detectUnsupportedDirectives(fullSchema);
  if (usingCustomResolvers || unsupportedDirectives.length > 0) {
    printer.info(`We detected that your GraphQL schema can not be auto-migrated because:`);
    if (usingCustomResolvers) {
      printer.info(`- You have configured custom resolvers for your GraphQL API`);
    }
    if (usingOverriddenResolvers) {
      printer.info(`- You have overwritten an Amplify generated resolver`);
    }
    if (unsupportedDirectives.length > 0) {
      printer.info(`- You are using the following directives not supported in the new transformer:\n\t ${unsupportedDirectives.join(', ')}`);
    }
    printer.info(`To migrate to the new GraphQL API capabilities, follow the step-by-step instructions
here: ${MIGRATION_URL}`);
    return false;
  }
  const chooseToRunMigration: string = await prompter.pick(`We detected that your GraphQL schema can be auto-migrated! In particular, we've made 
a number of authorization rule changes. Let's review the changes we'll apply to your
GraphQL schema:`, ['Continue', `No, I'll migrate later`]);
  const runMigration: boolean = chooseToRunMigration === 'Continue';
  return runMigration ? migrateToV2Transformer(resourceDir, context, schemaDocs) : runMigration;
}
