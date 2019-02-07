import * as fs from 'fs';
import * as path from 'path';
import { CloudFormation, Fn, Template } from "cloudform-types";
import GraphQLTransform from '..';
import Transformer from '../Transformer';
import DeploymentResources from '../DeploymentResources';
import { StackMappingOption } from '../GraphQLTransform';
import { ResourceConstants } from 'graphql-transformer-common';

const TRANSFORM_CONFIG_FILE_NAME = `transform.conf.json`;
const CLOUDFORMATION_FILE_NAME = 'cloudformation-template.json';
const PARAMETERS_FILE_NAME = 'parameters.json';

export interface ProjectOptions {
    projectDirectory: string
    transformers: Transformer[]
    rootStackFileName?: string
}

export async function buildProject(opts: ProjectOptions) {
    const userProjectConfig = await readProjectConfiguration(opts.projectDirectory)
    const stackMapping = getStackMappingsFromMigrationConfig(userProjectConfig.config.Migration);
    const transform = new GraphQLTransform({
        transformers: opts.transformers,
        stackMapping
    });
    let transformOutput = transform.transform(userProjectConfig.schema.toString());
    if (userProjectConfig.config && userProjectConfig.config.Migration) {
        transformOutput = adjustBuildForMigration(transformOutput, userProjectConfig.config.Migration);
    }
    const merged = mergeUserConfigWithTransformOutput(userProjectConfig, transformOutput)
    writeDeploymentToDisk(merged, path.join(opts.projectDirectory, 'build'), opts.rootStackFileName)
}

/**
 * Returns a map where the keys are the names of the resources and the values are root.
 * This will be passed to the transform constructor to cause resources from a migration
 * to remain in the top level stack.
 */
function getStackMappingsFromMigrationConfig(migrationConfig?: TransformMigrationConfig): StackMappingOption {
    if (migrationConfig && migrationConfig.V1) {
        const resourceIdsToHoist = migrationConfig.V1.Resources || [];
        return resourceIdsToHoist.reduce((acc: any, k: string) => ({ ...acc, [k]: 'root'}), {});
    }
    return {};
}

/**
 * This adjusts a project build to account for the resources created by a previous
 * version of the Amplify CLI. Mainly this prevents the deletion of DynamoDB tables
 * while still allowing the transform to customize that logical resource.
 * @param resources The resources to change.
 * @param idsToHoist The logical ids to hoist into the root of the template.
 */
function adjustBuildForMigration(resources: DeploymentResources, migrationConfig?: TransformMigrationConfig): DeploymentResources {
    if (migrationConfig && migrationConfig.V1) {
        const resourceIdsToHoist = migrationConfig.V1.Resources || [];
        if (resourceIdsToHoist.length === 0) {
            return resources;
        }
        const resourceIdMap = resourceIdsToHoist.reduce((acc: any, k: string) => ({ ...acc, [k]: true}), {});
        for (const stackKey of Object.keys(resources.stacks)) {
            const template = resources.stacks[stackKey];
            for (const resourceKey of Object.keys(template.Resources)) {
                if (resourceIdMap[resourceKey]) {
                    // Handle any special detials for migrated details.
                    const resource = template.Resources[resourceKey];
                    template.Resources[resourceKey] = formatMigratedResource(resource);
                }
            }
        }
        const rootStack = resources.rootStack;
        for (const resourceKey of Object.keys(rootStack.Resources)) {
            if (resourceIdMap[resourceKey]) {
                // Handle any special detials for migrated details.
                const resource = rootStack.Resources[resourceKey];
                rootStack.Resources[resourceKey] = formatMigratedResource(resource);
            }
        }
    }
    return resources;
}

/**
 * Merge user config on top of transform output when needed.
 */
function mergeUserConfigWithTransformOutput(
    userConfig: Partial<DeploymentResources>,
    transformOutput: DeploymentResources
) {
    // Override user defined resolvers.
    const userResolvers = userConfig.resolvers || {};
    const transformResolvers = transformOutput.resolvers;
    for (const userResolver of Object.keys(userResolvers)) {
        transformResolvers[userResolver] = userConfig.resolvers[userResolver]
    }

    // Override user defined stacks.
    const userStacks = userConfig.stacks || {};
    const transformStacks = transformOutput.stacks;
    const rootStack = transformOutput.rootStack;

    // Get all the transform stacks. Custom stacks will depend on all of them
    // so they can always access data sources created by the transform.
    const resourceTypesToDependOn = {
        "AWS::CloudFormation::Stack": true,
        "AWS::AppSync::GraphQLApi": true,
        "AWS::AppSync::GraphQLSchema": true,
    };
    const allResourceIds = Object.keys(rootStack.Resources).filter(
        (k: string) => {
            const resource = rootStack.Resources[k];
            return resourceTypesToDependOn[resource.Type];
        }
    );
    const parametersKeys = Object.keys(rootStack.Parameters);
    const customStackParams = parametersKeys.reduce((acc: any, k: string) => ({
        ...acc,
        [k]: Fn.Ref(k)
    }), {})
    customStackParams[ResourceConstants.PARAMETERS.AppSyncApiId] = Fn.GetAtt(
        ResourceConstants.RESOURCES.GraphQLAPILogicalID,
        'ApiId'
    );

    for (const userStack of Object.keys(userStacks)) {
        if (transformOutput.stacks[userStack]) {
            throw new Error(`You cannot provide a stack named ${userStack} as it \
            will be overwritten by a stack generated by the GraphQL Transform.`)
        }
        const userDefinedStack = userConfig.stacks[userStack];
        // Providing a parameter value when the parameters is not explicitly defined
        // in the template causes CloudFormation to throw and error. This will only
        // provide the value to the nested stack if the user has specified it.
        const parametersForStack = Object.keys(userDefinedStack.Parameters).reduce((acc, k) => ({
            ...acc,
            [k]: customStackParams[k],
        }), {});
        transformStacks[userStack] = userDefinedStack;
        // Split on non alphabetic characters to make a valid resource id.
        const stackResourceId = userStack.split(/[^A-Za-z]/).join('');
        const customNestedStack = new CloudFormation.Stack({
            Parameters: parametersForStack,
            TemplateURL: Fn.Join(
                '/',
                [
                    "https://s3.amazonaws.com",
                    Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
                    Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                    'stacks',
                    userStack
                ]
            )
        }).dependsOn(allResourceIds);
        rootStack.Resources[stackResourceId] = customNestedStack;
    }
    return {
        ...transformOutput,
        resolvers: transformResolvers,
        stacks: transformStacks
    }
}

export async function readSchema(projectDirectory: string) {
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
export async function readProjectConfiguration(projectDirectory: string): Promise<ProjectConfiguration> {
    // Schema
    const schema = await readSchema(projectDirectory);
    // Load the resolvers.
    const resolverDirectory = path.join(projectDirectory, 'resolvers')
    const resolverDirExists = await exists(resolverDirectory);
    const resolvers = {}
    if (resolverDirExists) {
        const resolverFiles = await readDir(resolverDirectory)
        for (const resolverFile of resolverFiles) {
            const resolverFilePath = path.join(resolverDirectory, resolverFile)
            resolvers[resolverFile] = await readFile(resolverFilePath)
        }
    }
    // Load the functions. TODO: Do we want to do this? Ideally push towards using amplify add function.
    // const functionsDirectory = path.join(projectDirectory, 'functions')
    // const functionsDirExists = await exists(functionsDirectory)
    // const functions = {}
    // if (functionsDirExists) {
    //     const functionFiles = await readDir(functionsDirectory)
    //     for (const functionFile of functionFiles) {
    //         const functionFilePath = path.join(functionsDirectory, functionFile)
    //         functions[functionFile] = await readFile(functionFilePath)
    //     }
    // }
    // Load the stacks.
    const stacksDirectory = path.join(projectDirectory, 'stacks')
    const stacksDirExists = await exists(stacksDirectory)
    const stacks = {}
    if (stacksDirExists) {
        const stackFiles = await readDir(stacksDirectory)
        for (const stackFile of stackFiles) {
            const stackFilePath = path.join(stacksDirectory, stackFile)
            throwIfNotJSON(stackFile);
            const stackBuffer = await readFile(stackFilePath);
            try {
                stacks[stackFile] = JSON.parse(stackBuffer.toString());
            } catch (e) {
                throw new Error(`The CloudFormation template ${stackFiles} does not contain valid JSON.`)
            }
        }
    }

    const configPath = path.join(projectDirectory, TRANSFORM_CONFIG_FILE_NAME);
    const configExists = await exists(configPath);
    let config = {};
    if (configExists) {
        const configStr = await readFile(configPath);
        config = JSON.parse(configStr.toString());
    }
    return {
        stacks,
        resolvers,
        schema,
        config
    }
}

function throwIfNotJSON(stackFile: string) {
    const nameParts = stackFile.split('.');
    const extension = nameParts[nameParts.length - 1];
    if (extension === "yaml" || extension === "yml") {
        throw new Error(`Yaml is not yet supported. Please convert the CloudFormation stack ${stackFile} to json.`)
    }
    if (extension !== "json") {
        throw new Error(`Invalid extension .${extension} for stack ${stackFile}`);
    }
}

export interface UploadOptions {
    directory: string,
    upload(blob: { Key: string, Body: Buffer | string}): Promise<string>
}
/**
 * Reads deployment assets from disk and uploads to the cloud via an uploader.
 * @param opts Deployment options.
 */
export async function uploadDeployment(opts: UploadOptions) {
    try {
        if (!opts.directory) {
            throw new Error(`You must provide a 'directory'`)
        } else if (!fs.existsSync(opts.directory)) {
            throw new Error(`Invalid 'directory': directory does not exist at ${opts.directory}`)
        }
        if (!opts.upload || typeof opts.upload !== 'function') {
            throw new Error(`You must provide an 'upload' function`)
        }
        await uploadDirectory(opts)
    } catch (e) {
        throw e
    }
}

/**
 * Uploads a file with exponential backoff up to a point.
 * @param opts The deployment options
 * @param key The bucket key
 * @param body The blob body as a buffer
 * @param backoffMS The time to wait this invocation
 * @param numTries The max number of tries
 */
async function uploadFile(opts: UploadOptions, key: string, body: Buffer, backoffMS: number = 1000, numTries: number = 5) {
    try {
        return await opts.upload({
            Key: key,
            Body: body
        })
    } catch (e) {
        if (numTries > 1) {
            await new Promise((res, rej) => setTimeout(() => res(), backoffMS))
            await uploadFile(opts, key, body, backoffMS * 2, numTries - 1)
        }
        throw e
    }
}

async function uploadDirectory(opts: UploadOptions, key: string = '') {
    const files = await readDir(opts.directory)
    for (const file of files) {
        const resourcePath = path.join(opts.directory, file)
        const uploadKey = path.join(key, file)
        const isDirectory = (await lstat(resourcePath)).isDirectory()
        if (isDirectory) {
            await uploadDirectory({ ...opts, directory: resourcePath }, uploadKey)
        } else {
            const resourceContents = await readFile(resourcePath);
            await uploadFile(opts, uploadKey, resourceContents)
        }
    }
}

function emptyDirectory(directory: string) {
    const files = fs.readdirSync(directory)
    for (const file of files) {
        const resourcePath = path.join(directory, file)
        const isDirectory = fs.lstatSync(resourcePath).isDirectory()
        if (isDirectory) {
            emptyDirectory(resourcePath)
        } else {
            fs.unlinkSync(resourcePath);
        }
    }
}

/**
 * Writes a deployment to disk at a path.
 */
function writeDeploymentToDisk(deployment: DeploymentResources, directory: string, rootStackFileName: string = 'rootStack.json') {

    // Delete the last deployments resources.
    emptyDirectory(directory)

    // Write the schema to disk
    const schema = deployment.schema;
    const fullSchemaPath = path.normalize(directory + `/schema.graphql`)
    fs.writeFileSync(fullSchemaPath, schema)

    // Setup the directories if they do not exist.
    initStacksAndResolversDirectories(directory);

    // Write resolvers to disk
    const resolverFileNames = Object.keys(deployment.resolvers);
    const resolverRootPath = path.normalize(directory + `/resolvers`)
    for (const resolverFileName of resolverFileNames) {
        const fullResolverPath = path.normalize(resolverRootPath + '/' + resolverFileName);
        fs.writeFileSync(fullResolverPath, deployment.resolvers[resolverFileName]);
    }

    // Write the stacks to disk
    const stackNames = Object.keys(deployment.stacks);
    const stackRootPath = path.normalize(directory + `/stacks`)
    for (const stackFileName of stackNames) {
        const fileNameParts = stackFileName.split('.');
        if (fileNameParts.length === 1) {
            fileNameParts.push('json')
        }
        const fullFileName = fileNameParts.join('.');
        throwIfNotJSON(fullFileName);
        const fullStackPath = path.normalize(stackRootPath + '/' + fullFileName);
        let stackString: any = deployment.stacks[stackFileName];
        stackString = typeof stackString === 'string' ? deployment.stacks[stackFileName] : JSON.stringify(deployment.stacks[stackFileName], null, 4);
        fs.writeFileSync(fullStackPath, stackString);
    }

    // Write any functions to disk
    const functionNames = Object.keys(deployment.functions);
    const functionRootPath = path.normalize(directory + `/functions`)
    if (!fs.existsSync(functionRootPath)) {
        fs.mkdirSync(functionRootPath);
    }
    for (const functionName of functionNames) {
        const fullFunctionPath = path.normalize(functionRootPath + '/' + functionName);
        const zipContents = fs.readFileSync(deployment.functions[functionName])
        fs.writeFileSync(fullFunctionPath, zipContents);
    }
    const rootStack = deployment.rootStack;
    const rootStackPath = path.normalize(directory + `/${rootStackFileName}`);
    fs.writeFileSync(rootStackPath, JSON.stringify(rootStack, null, 4));
}

async function readSchemaDocuments(schemaDirectoryPath: string): Promise<string[]> {
    const files = await readDir(schemaDirectoryPath);
    let schemaDocuments = [];
    for (const fileName of files) {
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

async function deleteDirectory(directory: string): Promise<void> {
    const pathExists = await exists(directory);
    if (!pathExists) {
        return;
    }
    const dirStats = await lstat(directory);
    if (!dirStats.isDirectory()) {
        return;
    }
    const files = await readDir(directory);
    for (const fileName of files) {
        const fullPath = path.join(directory, fileName);
        const stats = await lstat(fullPath);
        if (stats.isDirectory()) {
            await deleteDirectory(fullPath);
        } else if (stats.isFile()) {
            await unlink(fullPath);
        }
    }
}

interface MigrationOptions {
    projectDirectory: string
}
interface MigrationInfo {
    old: AmplifyApiV1Project
}
export async function migrateAPIProject(opts: MigrationOptions) {
    const projectDirectory = opts.projectDirectory;
    const projectConfig = await readV1ProjectConfiguration(projectDirectory);
    const copyOfProject = JSON.parse(JSON.stringify(projectConfig));
    const transformConfig = makeTransformConfigFromOldProject(projectConfig);
    await updateToIntermediateProject(projectDirectory, projectConfig, transformConfig);
    // const result = await updateProject()
    // TODO: Update stack without resolvers/iam roles/etc.
    return {
        old: copyOfProject
    }
}
export async function revertAPIMigration(directory: string, oldProject: AmplifyApiV1Project) {
    // Revert the v1 style CF doc.
    const oldCloudFormationTemplatePath = path.join(directory, CLOUDFORMATION_FILE_NAME);
    fs.writeFileSync(oldCloudFormationTemplatePath, JSON.stringify(oldProject.template, null, 4));
    const oldCloudFormationBuildTemplatePath = path.join(directory, 'build', CLOUDFORMATION_FILE_NAME);
    fs.writeFileSync(oldCloudFormationBuildTemplatePath, JSON.stringify(oldProject.template, null, 4));

    const parametersInputPath = path.join(directory, PARAMETERS_FILE_NAME);
    fs.writeFileSync(parametersInputPath, JSON.stringify(oldProject.parameters, null, 4));

    // Revert the config file by deleting it.
    const configFilePath = path.join(directory, TRANSFORM_CONFIG_FILE_NAME);
    if (fs.existsSync(configFilePath)) {
        fs.unlinkSync(configFilePath);
    }

    // Try to delete the stacks & resolver directories.
    const stacksDir = path.join(directory, 'stacks');
    const resolversDir = path.join(directory, 'resolvers');
    await deleteDirectory(stacksDir);
    await deleteDirectory(resolversDir);
}

interface AmplifyApiV1Project {
    schema: string;
    parameters: any;
    template: Template;
}
/**
 * Read the configuration for the old version of amplify CLI.
 */
export async function readV1ProjectConfiguration(projectDirectory: string): Promise<AmplifyApiV1Project> {
    // Schema
    const schema = await readSchema(projectDirectory);

    // Get the template
    const cloudFormationTemplatePath = path.join(projectDirectory, CLOUDFORMATION_FILE_NAME);
    const cloudFormationTemplateExists = await exists(cloudFormationTemplatePath);
    if (!cloudFormationTemplateExists) {
        throw new Error(`Could not find cloudformation template at ${cloudFormationTemplatePath}`);
    }
    const cloudFormationTemplateStr = await readFile(cloudFormationTemplatePath);
    const cloudFormationTemplate = JSON.parse(cloudFormationTemplateStr.toString());

    // Get the params
    const parametersFilePath = path.join(projectDirectory, 'parameters.json');
    const parametersFileExists = await exists(parametersFilePath);
    if (!parametersFileExists) {
        throw new Error(`Could not find parameters.json at ${parametersFilePath}`);
    }
    const parametersFileStr = await readFile(parametersFilePath);
    const parametersFile = JSON.parse(parametersFileStr.toString());

    return {
        template: cloudFormationTemplate,
        parameters: parametersFile,
        schema
    }
}

/**
 * TransformConfig records a set of logical ids that should be preserved
 * in the top level template to prevent deleting resources that holds data and
 * that were created before the new nested stack config.
 */
interface TransformMigrationConfig {
    V1?: {
        Resources: string[];
    }
}
interface TransformConfig {
    Migration?: TransformMigrationConfig;
}
export function makeTransformConfigFromOldProject(project: AmplifyApiV1Project): TransformConfig {
    const migrationResourceIds = [];
    for (const key of Object.keys(project.template.Resources)) {
        const resource = project.template.Resources[key];
        switch (resource.Type) {
            case 'AWS::DynamoDB::Table': {
                migrationResourceIds.push(key);
                // When searchable is used we need to keep the output stream arn
                // output at the top level as well. TODO: Only do this when searchable is enabled.
                // migrationOutputIds.push(`GetAtt${key}StreamArn`);
                break;
            }
            case 'AWS::Elasticsearch::Domain': {
                migrationResourceIds.push(key);
                break;
            }
            // case 'AWS::IAM::Role': {
            //     if (key === 'ElasticSearchAccessIAMRole') {
            //         // A special case for deploying the migration to projects with @searchable.
            //         // This keeps an IAM role needed by the old ES policy document around.
            //         migrationResourceIds.push(key);
            //     }
            //     break;
            // }
            default: {
                break;
            }
        }
    }
    // for (const key of Object.keys(project.template.Outputs)) {
    //     // Pull any outputs that reference a hoisted id.
    //     const output = project.template.Outputs[key];
    //     const outputValue = output.Value;
    //     let refdId;
    //     if (outputValue["Fn::GetAtt"]) {
    //         refdId = outputValue["Fn::GetAtt"][0];
    //     } else if (outputValue["Fn::Ref"]) {
    //         refdId = outputValue["Fn::Ref"];
    //     }
    //     if (refdId && migrationResourceIds.find(id => id === refdId)) {
    //         migrationOutputIds.push(key);
    //     }
    // }
    return {
        Migration: {
            V1: {
                Resources: migrationResourceIds
            }
        }
    }
}

function formatMigratedResource(obj: any) {
    const jsonNode = obj && typeof obj.toJSON === 'function' ? obj.toJSON() : obj;
    // const withReplacedReferences = replaceReferencesForMigration(obj);
    const withoutEncryption = removeSSE(jsonNode);
    return withoutEncryption;
}

function removeSSE(resource: any) {
    if (resource && resource.Properties && resource.Properties.SSESpecification) {
        delete resource.Properties.SSESpecification;
    }
    return resource;
}

/**
 * Walks the object and replaces the offending Ref with the correct GetAtt
 * as is required by the migration tool.
 */
function replaceReferencesForMigration(obj: any) {
    const jsonNode = obj && typeof obj.toJSON === 'function' ? obj.toJSON() : obj;
    if (Array.isArray(jsonNode)) {
        for (let i = 0; i < jsonNode.length; i++) {
            const replaced = formatMigratedResource(jsonNode[i]);
            jsonNode[i] = replaced;
        }
        return jsonNode;
    } else if (typeof jsonNode === 'object') {
        const ref = jsonNode.Ref || jsonNode['Fn::Ref'];
        if (ref && ref === 'GetAttGraphQLAPIApiId') {
            return {
                "Fn::GetAtt": [
                    "GraphQLAPI",
                    "ApiId"
                ]
            };
        }
        for (const key of Object.keys(jsonNode)) {
            const replaced = formatMigratedResource(jsonNode[key]);
            jsonNode[key] = replaced
        }
        return jsonNode;
    }
    return jsonNode;
}

/**
 * Updates the project to a temporary configuration that stages the real migration.
 */
async function updateToIntermediateProject(projectDirectory: string, project: AmplifyApiV1Project, config: TransformConfig) {
    // Write the schema to disk
    const migrationInfoFilePath = path.join(projectDirectory, TRANSFORM_CONFIG_FILE_NAME);
    fs.writeFileSync(migrationInfoFilePath, JSON.stringify(config, null, 4));

    const filteredResources = {};
    for (const key of Object.keys(project.template.Resources)) {
        const resource = project.template.Resources[key];
        switch (resource.Type) {
            case 'AWS::DynamoDB::Table':
            case 'AWS::Elasticsearch::Domain':
            case 'AWS::AppSync::GraphQLApi':
            case 'AWS::AppSync::ApiKey':
            case 'AWS::Cognito::UserPool':
            case 'AWS::Cognito::UserPoolClient':
                filteredResources[key] = formatMigratedResource(resource);
                break;
            case 'AWS::IAM::Role': {
                if (key === 'ElasticSearchAccessIAMRole') {
                    // A special case for the ES migration case.
                    filteredResources[key] = resource;
                }
                break;
            }
            case 'AWS::AppSync::GraphQLSchema':
                const alteredResource = { ...resource };
                alteredResource.Properties.DefinitionS3Location = {
                    "Fn::Sub": [
                        "s3://${S3DeploymentBucket}/${S3DeploymentRootKey}/schema.graphql",
                        {
                            "S3DeploymentBucket": {
                                "Ref": "S3DeploymentBucket"
                            },
                            "S3DeploymentRootKey": {
                                "Ref": "S3DeploymentRootKey"
                            }
                        }
                    ]
                };
                filteredResources[key] = alteredResource;
                break;
            default:
                break; // Everything else will live in a nested stack.
        }
    }

    const filteredParameterValues = {};
    const filteredTemplateParameters = {
        env: {
            Type: "String",
            Description: "The environment name. e.g. Dev, Test, or Production",
            Default: "NONE"
        },
        S3DeploymentBucket: {
            Type: "String",
            Description: "The S3 bucket containing all deployment assets for the project."
        },
        S3DeploymentRootKey: {
            Type: "String",
            Description: "An S3 key relative to the S3DeploymentBucket that points to the root of the deployment directory."
        }
    };
    for (const key of Object.keys(project.template.Parameters)) {
        switch (key) {
            case 'ResolverBucket':
            case 'ResolverRootKey':
            case 'DeploymentTimestamp':
            case 'schemaGraphql':
                break;
            default: {
                const param = project.template.Parameters[key];
                filteredTemplateParameters[key] = param;
                if (project.parameters[key]) {
                    filteredParameterValues[key] = project.parameters[key];
                }
                break;
            }
        }
    }

    const templateCopy = {
        ...project.template,
        Resources: filteredResources,
        Parameters: filteredTemplateParameters
    }

    // Remove the old cloudformation file.
    const oldCloudFormationTemplatePath = path.join(projectDirectory, CLOUDFORMATION_FILE_NAME);
    fs.unlinkSync(oldCloudFormationTemplatePath);

    // Write the new cloudformation file to the build.
    const cloudFormationTemplateOutputPath = path.join(projectDirectory, 'build', CLOUDFORMATION_FILE_NAME);
    fs.writeFileSync(cloudFormationTemplateOutputPath, JSON.stringify(templateCopy, null, 4));

    // We write the filtered values at the top level and the deployment
    // parameters in the build/ directory. We will no longer change the
    // top level parameters.json to hold the promise that we do not change
    // anything outside of build/
    const parametersInputPath = path.join(projectDirectory, PARAMETERS_FILE_NAME);
    fs.writeFileSync(parametersInputPath, JSON.stringify(filteredParameterValues, null, 4));

    // If the resolvers & stacks directories do not exist, create them.
    initStacksAndResolversDirectories(projectDirectory);
}

function initStacksAndResolversDirectories(directory: string) {
    const resolverRootPath = path.normalize(directory + `/resolvers`)
    if (!fs.existsSync(resolverRootPath)) {
        fs.mkdirSync(resolverRootPath);
    }
    const stackRootPath = path.normalize(directory + `/stacks`)
    if (!fs.existsSync(stackRootPath)) {
        fs.mkdirSync(stackRootPath);
    }
}

const readDir = async (dir: string) => await promisify<string, string[]>(fs.readdir, dir)
const readFile = async (p: string) => await promisify(fs.readFile, p)
const lstat = async (dir: string) => await promisify(fs.lstat, dir)
const exists = async (p: string) => await new Promise((res) => fs.exists(p, e => res(e)))
const unlink = async (p: string) => await new Promise((res, rej) => fs.unlink(p, e => e ? rej(e) : res()))
function promisify<A, O>(fn: (arg: A, cb: (err: Error, data: O) => void) => void, a: A): Promise<O> {
    return new Promise((res, rej) => {
        fn(a, (err, d) => {
            err ? rej(err) : res(d)
        })
    })
}