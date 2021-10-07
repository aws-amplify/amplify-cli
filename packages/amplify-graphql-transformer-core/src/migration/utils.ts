import * as fs from 'fs-extra';
import { stateManager } from 'amplify-cli-core';

export type SchemaDocument = {
  schema: string;
  filePath: string;
}

/**
 * Copies the schema to the same location with extension .bkp
 * @param schemaPath
 */
export async function backupSchema(schemaPath: string): Promise<void> {
  await fs.copyFile(schemaPath, `${schemaPath}.bkp`);
}

export async function readSingleFileSchema(schemaPath: string): Promise<SchemaDocument[]> {
  let schema: string = (await fs.readFile(schemaPath)).toString();
  return [{ schema: schema, filePath: schemaPath }];
}

export async function replaceFile(newSchema: string, filePath: string): Promise<void> {
  await fs.writeFile(filePath, newSchema, {encoding: 'utf-8', flag: 'w'});
}

export function removeBkpExtension(path: string): string {
  return path.slice(0, path.length - 4);
}

export async function readSchemaDocuments(schemaDirectoryPath: string): Promise<SchemaDocument[]> {
  const files = await fs.readdir(schemaDirectoryPath);
  let schemaDocuments: Array<SchemaDocument> = [];
  for (const fileName of files) {
    if (!fileName.endsWith(".graphql")) {
      continue;
    }

    const fullPath = `${schemaDirectoryPath}/${fileName}`;
    const stats = await fs.lstat(fullPath);
    if (stats.isDirectory()) {
      const childDocs = await readSchemaDocuments(fullPath);
      schemaDocuments = schemaDocuments.concat(childDocs);
    } else if (stats.isFile()) {
      const schemaDoc = await fs.readFile(fullPath);
      schemaDocuments.push({ schema: schemaDoc.toString(), filePath: fullPath });
    }
  }
  return schemaDocuments;
}

export async function undoAllSchemaMigration(resourceDir: string): Promise<void> {
  const files = await fs.readdir(resourceDir);
  for (const fileName of files) {
    if (!fileName.endsWith(".bkp")) {
      continue;
    }

    const fullPath = `${resourceDir}/${fileName}`;
    const stats = await fs.lstat(fullPath);
    if (stats.isDirectory()) {
      await undoAllSchemaMigration(fullPath);
    } else if (stats.isFile()) {
      fs.moveSync(fullPath, removeBkpExtension(fullPath), { overwrite: true });
    }
  }
}

export async function getDefaultAuthFromContext(): Promise<string> {
  const backendConfig = stateManager.getBackendConfig();
  if (Object.keys(backendConfig.api).length < 1) {
    return "AMAZON_COGNITO_USER_POOLS"
  }
  // Only support one API, so grab the ID
  const firstAPIID = Object.keys(backendConfig.api)[0];
  return backendConfig.api[firstAPIID].output.authConfig.defaultAuthentication.authenticationType;
}
