import { TransformConfig } from '@aws-amplify/graphql-transformer-core';
import fs from 'fs-extra';
import { TRANSFORM_CONFIG_FILE_NAME } from 'graphql-transformer-core';
import * as path from 'path';

export interface ProjectOptions {
  projectDirectory?: string;
  transformersFactory: Function;
  transformersFactoryArgs: object[];
  currentCloudBackendDirectory: string;
  rootStackFileName?: string;
  dryRun?: boolean;
  disableFunctionOverrides?: boolean;
  disablePipelineFunctionOverrides?: boolean;
  disableResolverOverrides?: boolean;
  buildParameters?: Object;
  minify?: boolean;
}

/**
 * try to load transformer config from specified projectDir
 * if it does not exist then we return a blank object
 *  */

export async function loadConfig(projectDir: string): Promise<TransformConfig> {
  // Initialize the config always with the latest version, other members are optional for now.
  let config: TransformConfig = {};
  try {
    const configPath = path.join(projectDir, TRANSFORM_CONFIG_FILE_NAME);
    const configExists = fs.existsSync(configPath);
    if (configExists) {
      const configStr = await fs.readFile(configPath, 'utf-8');
      config = JSON.parse(configStr);
    }
    return config as TransformConfig;
  } catch (err) {
    return config;
  }
}

export async function writeConfig(projectDir: string, config: TransformConfig): Promise<TransformConfig> {
  const configFilePath = path.join(projectDir, TRANSFORM_CONFIG_FILE_NAME);
  await fs.writeFile(configFilePath, JSON.stringify(config, null, 4));
  return config;
}

export function throwIfNotJSONExt(stackFile: string): void {
  const extension = path.extname(stackFile);
  if (extension === '.yaml' || extension === '.yml') {
    throw new Error(`Yaml is not yet supported. Please convert the CloudFormation stack ${stackFile} to json.`);
  }
  if (extension !== '.json') {
    throw new Error(`Invalid extension ${extension} for stack ${stackFile}`);
  }
}

/**
 * Given a project directory read the schema from disk. The schema may be a
 * single schema.graphql or a set of .graphql files in a directory named `schema`.
 * Preference is given to the `schema.graphql` if provided.
 * @param projectDirectory The project directory.
 */
export async function readSchema(projectDirectory: string): Promise<string> {
  const schemaFilePath = path.join(projectDirectory, 'schema.graphql');
  const schemaDirectoryPath = path.join(projectDirectory, 'schema');
  const schemaFileExists = fs.existsSync(schemaFilePath);
  const schemaDirectoryExists = fs.existsSync(schemaDirectoryPath);
  let schema;
  if (schemaFileExists) {
    schema = (await fs.readFile(schemaFilePath)).toString();
  } else if (schemaDirectoryExists) {
    schema = (await readSchemaDocuments(schemaDirectoryPath)).join('\n');
  } else {
    throw new Error(`Could not find a schema at ${schemaFilePath}`);
  }
  return schema;
}

async function readSchemaDocuments(schemaDirectoryPath: string): Promise<string[]> {
  const files = await fs.readdir(schemaDirectoryPath);
  let schemaDocuments = [];
  for (const fileName of files) {
    if (fileName.indexOf('.') === 0) {
      continue;
    }

    const fullPath = `${schemaDirectoryPath}/${fileName}`;
    const stats = await fs.lstat(fullPath);
    if (stats.isDirectory()) {
      const childDocs = await readSchemaDocuments(fullPath);
      schemaDocuments = schemaDocuments.concat(childDocs);
    } else if (stats.isFile()) {
      const schemaDoc = await fs.readFile(fullPath);
      schemaDocuments.push(schemaDoc);
    }
  }
  return schemaDocuments;
}
