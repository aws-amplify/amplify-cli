import * as fs from 'fs-extra';

export type SchemaDocument = {
  schema: string;
  filePath: string;
}

export function getResourceDir(): string {
  return '';
}

/**
 * Copies the schema to the same location with extension .bkp
 * @param schemaPath
 */
export async function backupSchema(schemaPath: string): Promise<void> {
  await fs.copyFile(schemaPath, `${schemaPath}.bkp`);
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
