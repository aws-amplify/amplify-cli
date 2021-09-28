import * as fs from 'fs-extra';
import { parse, print, visit } from 'graphql'
import { migrateKeys } from './migrators/key'
import { migrateAuth } from './migrators/auth'
import { migrateConnection } from './migrators/connection'
import {
  backupSchema,
  getDefaultAuthFromContext,
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

const cliToMigratorAuthMap: Map<string, string> = new Map<string, string>([
  ['API_KEY', 'apiKey'],
  ['AWS_IAM', 'iam'],
  ['AMAZON_COGNITO_USER_POOLS', 'userPools'],
  ['OPENID_CONNECT', 'oidc']
]);

function migrateGraphQLSchema(schema: string, authMode: string, massSchema: DocumentNode): string {
  let output = parse(schema)
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

async function askMigration(singleFileExists: boolean, directoryExists: boolean): Promise<boolean> {
  await printer.info(`About to begin schema migration, found valid target(s) for migration:\n${singleFileExists ? 'schema.graphql\n' : ''}${directoryExists ? 'schema directory\n' : ''}\n`);
  await printer.info('If you confirm migration, you will receive no further prompts and all migration will be completed. The CLI will exit after migration and will not push your resources to give you time to review.');
  await printer.warn('If you are using @auth, we strongly recommend spending extra time reviewing your auth rules after migration to ensure they\'re accurate');
  return await prompter.confirmContinue("About to start migrating to V2 transformer, are you ready to continue?");
}

async function runMigration(schemas: SchemaDocument[], authMode: string): Promise<void> {
  let fullSchema: string;
  let schemaList: string[] = new Array(schemas.length);
  let backupSchemaPromiseArray: Promise<void>[] = [];
  schemas.forEach((doc, idx) => {
    schemaList[idx] = doc.schema;
    backupSchemaPromiseArray.push(backupSchema(doc.filePath));
  });
  for (let promise of backupSchemaPromiseArray) {
    await promise;
  }

  fullSchema = schemaList.join('\n');
  let fullSchemaNode = parse(fullSchema);
  let writeNewPromiseArray: Promise<void>[] = [];
  schemas.forEach(doc => {
    const newSchema = migrateGraphQLSchema(doc.schema, authMode, fullSchemaNode);
    writeNewPromiseArray.push(replaceFile(newSchema, doc.filePath));
  });

  for (let promise of writeNewPromiseArray) {
    await promise;
  }
}

export async function updateTransformerVersion(env: string): Promise<void> {
  const projectPath = pathManager.findProjectRoot() ?? process.cwd();
  let envCLI = true;
  let cliJSON: any;
  try {
    cliJSON = stateManager.getCLIJSON(projectPath, env);
  }
  catch (e) {
    if (e.message.includes("File at path:") && e.message.includes("does not exist")) {
      envCLI = false;
      cliJSON = stateManager.getCLIJSON(projectPath);
    }
    else {
      throw e;
    }
  }
  if (!cliJSON.features) {
    cliJSON.features = {};
  }
  if (!cliJSON.features.graphqltransformer) {
    cliJSON.features.graphqltransformer = {}
  }
  cliJSON.features.graphqltransformer.useexperimentalpipelinedtransformer = true;

  if (envCLI) {
    stateManager.setCLIJSON(projectPath, cliJSON, env);
  }
  else {
    stateManager.setCLIJSON(projectPath, cliJSON);
  }
  await FeatureFlags.reloadValues();
}

export async function migrateToV2Transformer(resourceDir: string, context: $TSContext): Promise<boolean> {
  const { envName } = context.amplify.getEnvInfo();
  const defaultAuth = await getDefaultAuthFromContext();
  const authMode = cliToMigratorAuthMap.get(defaultAuth);
  if (!authMode) {
    throw Error(`Unidentified authorization mode for API found: ${defaultAuth}`);
  }
  const schemaFilePath = path.join(resourceDir, 'schema.graphql');
  const schemaDirectoryPath = path.join(resourceDir, 'schema');
  const schemaFileExists = await fs.existsSync(schemaFilePath);
  const schemaDirectoryExists = await fs.existsSync(schemaDirectoryPath);

  if (schemaFileExists || schemaDirectoryExists) {
    let migrateCheck = await askMigration(schemaFileExists, schemaDirectoryExists);
    if (!migrateCheck) {
      await printer.info("Skipping schema migration, did not receive confirmation.");
      return false;
    }
  }
  try {
    if (schemaFileExists) {
      await runMigration(await readSingleFileSchema(schemaFilePath), authMode);
    }
    if (schemaDirectoryExists) {
      await runMigration(await readSchemaDocuments(schemaDirectoryPath), authMode);
    }
    await updateTransformerVersion(envName);
    await printer.info("Successfully migrated schema(s), please review them to ensure they've been properly migrated before running 'amplify push'. Pay extra care with any auth rules to ensure your data remains secured.");
    exitOnNextTick(0);
  }
  catch (error) {
    await printer.error("Encountered an error while migrating schema to V2 transformer, reverting to old schemas");
    await undoAllSchemaMigration(resourceDir);
    throw error;
  }
  return true;
}
