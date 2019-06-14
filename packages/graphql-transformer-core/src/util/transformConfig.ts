const TRANSFORM_CONFIG_FILE_NAME = `transform.conf.json`;
import * as path from 'path';
import { Template } from "cloudform-types";
import { exists, readFile, writeFile, readDir, throwIfNotJSONExt, lstat } from './fileUtils';

export interface TransformMigrationConfig {
    V1?: {
        Resources: string[];
    }
}
/**
 * The transform config is specified in transform.conf.json within an Amplify
 * API project directory.
 */
export interface TransformConfig {

    /**
     * For backwards compatibility we store a set of resource logical ids that
     * should be preserved in the top level template to prevent deleting
     * resources that holds data and that were created before the new nested stack config.
     * This should not be used moving forwards. Moving forward, use the StackMapping instead which
     * generalizes this behavior.
     */
    Migration?: TransformMigrationConfig;
}
export async function loadConfig(projectDir: string): Promise<TransformConfig> {
    const configPath = path.join(projectDir, TRANSFORM_CONFIG_FILE_NAME);
    const configExists = await exists(configPath);
    let config = {};
    if (configExists) {
        const configStr = await readFile(configPath);
        config = JSON.parse(configStr.toString());
    }
    return config as TransformConfig;
}
export async function writeConfig(projectDir: string, config: TransformConfig): Promise<TransformConfig> {
    const configFilePath = path.join(projectDir, TRANSFORM_CONFIG_FILE_NAME);
    await writeFile(configFilePath, JSON.stringify(config, null, 4));
    return config;
}

/**
 * Given an absolute path to an amplify project directory, load the
 * user defined configuration.
 */
interface ProjectConfiguration {
    schema: string;
    resolvers: {
        [k: string]: string,
    },
    stacks: {
        [k: string]: Template
    },
    config: TransformConfig
}
export async function loadProject(projectDirectory: string): Promise<ProjectConfiguration> {
    // Schema
    const schema = await readSchema(projectDirectory);
    // Load the resolvers.
    const resolverDirectory = path.join(projectDirectory, 'resolvers')
    const resolverDirExists = await exists(resolverDirectory);
    const resolvers = {}
    if (resolverDirExists) {
        const resolverFiles = await readDir(resolverDirectory)
        for (const resolverFile of resolverFiles) {
            if (resolverFile.indexOf('.') === 0) {
                continue;
            }

            const resolverFilePath = path.join(resolverDirectory, resolverFile)
            resolvers[resolverFile] = await readFile(resolverFilePath)
        }
    }
    const stacksDirectory = path.join(projectDirectory, 'stacks')
    const stacksDirExists = await exists(stacksDirectory)
    const stacks = {}
    if (stacksDirExists) {
        const stackFiles = await readDir(stacksDirectory)
        for (const stackFile of stackFiles) {
            if (stackFile.indexOf('.') === 0) {
                continue;
            }

            const stackFilePath = path.join(stacksDirectory, stackFile)
            throwIfNotJSONExt(stackFile);
            const stackBuffer = await readFile(stackFilePath);
            try {
                stacks[stackFile] = JSON.parse(stackBuffer.toString());
            } catch (e) {
                throw new Error(`The CloudFormation template ${stackFiles} does not contain valid JSON.`)
            }
        }
    }

    const config = await loadConfig(projectDirectory);
    return {
        stacks,
        resolvers,
        schema,
        config
    }
}

/**
 * Given a project directory read the schema from disk. The schema may be a
 * single schema.graphql or a set of .graphql files in a directory named `schema`.
 * Preference is given to the `schema.graphql` if provided.
 * @param projectDirectory The project directory.
 */
export async function readSchema(projectDirectory: string): Promise<string> {
    const schemaFilePath = path.join(projectDirectory, 'schema.graphql')
    const schemaDirectoryPath = path.join(projectDirectory, 'schema')
    const schemaFileExists = await exists(schemaFilePath);
    const schemaDirectoryExists = await exists(schemaDirectoryPath);
    let schema;
    if (schemaFileExists) {
        schema = (await readFile(schemaFilePath)).toString()
    } else if (schemaDirectoryExists) {
        schema = (await readSchemaDocuments(schemaDirectoryPath)).join('\n');
    } else {
        throw new Error(`Could not find a schema at ${schemaFilePath}`)
    }
    return schema;
}

async function readSchemaDocuments(schemaDirectoryPath: string): Promise<string[]> {
    const files = await readDir(schemaDirectoryPath);
    let schemaDocuments = [];
    for (const fileName of files) {
        if (fileName.indexOf('.') === 0) {
            continue;
        }

        const fullPath = `${schemaDirectoryPath}/${fileName}`;
        const stats = await lstat(fullPath);
        if (stats.isDirectory()) {
            const childDocs = await readSchemaDocuments(fullPath);
            schemaDocuments = schemaDocuments.concat(childDocs);
        } else if (stats.isFile()) {
            const schemaDoc = await readFile(fullPath);
            schemaDocuments.push(schemaDoc);
        }
    }
    return schemaDocuments;
}