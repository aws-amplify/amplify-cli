import * as path from 'path';
import { TransformConfig, TransformerProjectConfig } from '@aws-amplify/graphql-transformer-core';
import fs from 'fs-extra';

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

export const TRANSFORM_CONFIG_FILE_NAME = `transform.conf.json`;

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

/**
 * Given an absolute path to an amplify project directory, load the
 * user defined configuration.
 */

export async function loadProject(projectDirectory: string, opts?: ProjectOptions): Promise<TransformerProjectConfig> {
  // Schema
  const schema = await readSchema(projectDirectory);

  // Load functions
  const functions = {};
  if (!(opts && opts.disableFunctionOverrides === true)) {
    const functionDirectory = path.join(projectDirectory, 'functions');
    const functionDirectoryExists = fs.existsSync(functionDirectory);
    if (functionDirectoryExists) {
      const functionFiles = await fs.readdir(functionDirectory);
      for (const functionFile of functionFiles) {
        if (functionFile.indexOf('.') === 0) {
          continue;
        }
        const functionFilePath = path.join(functionDirectory, functionFile);
        functions[functionFile] = functionFilePath;
      }
    }
  }

  // load pipeline functions - deprecated
  const pipelineFunctions = {};
  if (!(opts && opts.disablePipelineFunctionOverrides === true)) {
    const pipelineFunctionDirectory = path.join(projectDirectory, 'pipelineFunctions');
    const pipelineFunctionDirectoryExists = fs.existsSync(pipelineFunctionDirectory);
    if (pipelineFunctionDirectoryExists) {
      const pipelineFunctionFiles = await fs.readdir(pipelineFunctionDirectory);
      for (const pipelineFunctionFile of pipelineFunctionFiles) {
        if (pipelineFunctionFile.indexOf('.') === 0) {
          continue;
        }
        const pipelineFunctionPath = path.join(pipelineFunctionDirectory, pipelineFunctionFile);
        pipelineFunctions[pipelineFunctionFile] = await fs.readFile(pipelineFunctionPath);
      }
    }
  }

  // Load the resolvers
  const resolvers = {};
  if (!(opts && opts.disableResolverOverrides === true)) {
    const resolverDirectory = path.join(projectDirectory, 'resolvers');
    const resolverDirExists = fs.existsSync(resolverDirectory);
    if (resolverDirExists) {
      const resolverFiles = await fs.readdir(resolverDirectory);
      for (const resolverFile of resolverFiles) {
        if (resolverFile.indexOf('.') === 0) {
          continue;
        }
        const resolverFilePath = path.join(resolverDirectory, resolverFile);
        resolvers[resolverFile] = await fs.readFile(resolverFilePath);
      }
    }
  }

  // Load Stacks
  const stacksDirectory = path.join(projectDirectory, 'stacks');
  const stacksDirExists = fs.existsSync(stacksDirectory);
  const stacks = {};
  if (stacksDirExists) {
    const stackFiles = await fs.readdir(stacksDirectory);
    for (const stackFile of stackFiles) {
      if (stackFile.indexOf('.') === 0) {
        continue;
      }

      const stackFilePath = path.join(stacksDirectory, stackFile);
      throwIfNotJSONExt(stackFile);
      const stackBuffer = await fs.readFile(stackFilePath);
      try {
        stacks[stackFile] = JSON.parse(stackBuffer.toString());
      } catch (e) {
        throw new Error(`The CloudFormation template ${stackFiles} does not contain valid JSON.`);
      }
    }
  }

  const config = await loadConfig(projectDirectory);
  return {
    functions,
    pipelineFunctions,
    stacks,
    resolvers,
    schema,
    config,
  };
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
