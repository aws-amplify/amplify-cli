const fs = require('fs-extra');
import * as path from 'path';
import { CloudFormation, Fn, Template, Cognito } from "cloudform-types";
import GraphQLTransform from '..';
import Transformer from '../Transformer';
import DeploymentResources from '../DeploymentResources';
import { StackMapping } from '../GraphQLTransform';
import { ResourceConstants } from 'graphql-transformer-common';
import { walkDirPosix, readFromPath, writeToPath, throwIfNotJSONExt, emptyDirectory } from './fileUtils';
import { writeConfig, TransformConfig, TransformMigrationConfig, loadProject, readSchema, loadConfig } from './transformConfig';
import * as Sanity from './sanity-check';

const CLOUDFORMATION_FILE_NAME = 'cloudformation-template.json';
const PARAMETERS_FILE_NAME = 'parameters.json';

export interface ProjectOptions {
    projectDirectory?: string
    transformers: Transformer[]
    currentCloudBackendDirectory: string
    rootStackFileName?: string
    dryRun?: boolean,
    disableResolverOverrides?: boolean,
}
export async function buildProject(opts: ProjectOptions) {
    await ensureMissingStackMappings(opts);
    const builtProject = await _buildProject(opts);
    if (opts.projectDirectory && !opts.dryRun) {
        await writeDeploymentToDisk(builtProject, path.join(opts.projectDirectory, 'build'), opts.rootStackFileName)
        if (opts.currentCloudBackendDirectory) {
            const lastBuildPath = path.join(opts.currentCloudBackendDirectory, 'build');
            const thisBuildPath = path.join(opts.projectDirectory, 'build');
            await Sanity.check(lastBuildPath, thisBuildPath, opts.rootStackFileName);
        }
    }
    return builtProject;
}

async function _buildProject(opts: ProjectOptions) {
    const userProjectConfig = await loadProject(opts.projectDirectory, opts)
    const stackMapping = getStackMappingFromProjectConfig(userProjectConfig.config);
    const transform = new GraphQLTransform({
        transformers: opts.transformers,
        stackMapping
    });
    let transformOutput = transform.transform(userProjectConfig.schema.toString());
    if (userProjectConfig.config && userProjectConfig.config.Migration) {
        transformOutput = adjustBuildForMigration(transformOutput, userProjectConfig.config.Migration);
    }
    const merged = mergeUserConfigWithTransformOutput(userProjectConfig, transformOutput)
    return merged;
}

/**
 * Returns a map where the keys are the names of the resources and the values are root.
 * This will be passed to the transform constructor to cause resources from a migration
 * to remain in the top level stack.
 */
function getStackMappingFromProjectConfig(config?: TransformConfig): StackMapping {
    const stackMapping = getOrDefault(config, 'StackMapping', {});
    const migrationConfig = config.Migration;
    if (migrationConfig && migrationConfig.V1) {
        const resourceIdsToHoist = migrationConfig.V1.Resources || [];
        for (const idToHoist of resourceIdsToHoist) {
            stackMapping[idToHoist] = 'root';
        }
    }
    return stackMapping;
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
 * Provided a build configuration & current-cloud-backend directory, calculate
 * any missing stack mappings that might have been caused by the stack mapping
 * bug in June 2019 (https://github.com/aws-amplify/amplify-cli/issues/1652).
 * This allows APIs that were deployed with the bug to continue
 * working without changes.
 */
export async function ensureMissingStackMappings(config: ProjectOptions) {
    const { currentCloudBackendDirectory } = config;

    if (currentCloudBackendDirectory) {
        const missingStackMappings = {};
        const transformOutput = await _buildProject(config);
        const copyOfCloudBackend = await readFromPath(currentCloudBackendDirectory);
        const stackMapping = transformOutput.stackMapping;
        if (copyOfCloudBackend && copyOfCloudBackend.build) {
            // leave the custom stack alone. Don't split them into separate stacks
            const customStacks = Object.keys(copyOfCloudBackend.stacks || {});
            const stackNames = Object.keys(copyOfCloudBackend.build.stacks).filter(
                stack => !customStacks.includes(stack)
              );

            // We walk through each of the stacks that were deployed in the most recent deployment.
            // If we find a resource that was deployed into a different stack than it should have
            // we make a note of it and include it in the missing stack mapping.
            for (const stackFileName of stackNames) {
                const stackName = stackFileName.slice(0, stackFileName.length - path.extname(stackFileName).length);
                const lastDeployedStack = JSON.parse(copyOfCloudBackend.build.stacks[stackFileName]);
                if (lastDeployedStack) {
                    const resourceIdsInStack = Object.keys(lastDeployedStack.Resources);
                    for (const resourceId of resourceIdsInStack) {
                        if (stackMapping[resourceId] && stackName !== stackMapping[resourceId]) {
                            missingStackMappings[resourceId] = stackName;
                        }
                    }
                    const outputIdsInStack = Object.keys(lastDeployedStack.Outputs);
                    for (const outputId of outputIdsInStack) {
                        if (stackMapping[outputId] && stackName !== stackMapping[outputId]) {
                            missingStackMappings[outputId] = stackName;
                        }
                    }
                }
            }

            // We then do the same thing with the root stack.
            const lastDeployedStack = JSON.parse(copyOfCloudBackend.build[config.rootStackFileName]);
            const resourceIdsInStack = Object.keys(lastDeployedStack.Resources);
            for (const resourceId of resourceIdsInStack) {
                if (stackMapping[resourceId] && 'root' !== stackMapping[resourceId]) {
                    missingStackMappings[resourceId] = 'root';
                }
            }
            const outputIdsInStack = Object.keys(lastDeployedStack.Outputs);
            for (const outputId of outputIdsInStack) {
                if (stackMapping[outputId] && 'root' !== stackMapping[outputId]) {
                    missingStackMappings[outputId] = 'root';
                }
            };
            // If there are missing stack mappings, we write them to disk.
            if (Object.keys(missingStackMappings).length) {
                let conf = await loadConfig(config.projectDirectory);
                conf = { ...conf, StackMapping: { ...getOrDefault(conf, 'StackMapping', {}), ...missingStackMappings } };
                await writeConfig(config.projectDirectory, conf);
            }
        }
    }
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
    // Looping through the parameters defined by the transform (aka. rootStack)
    const parametersKeys = Object.keys(rootStack.Parameters);
    const customStackParams = parametersKeys.reduce((acc: any, k: string) => ({
        ...acc,
        [k]: Fn.Ref(k)
    }), {})
    // customStackParams is a map that will be passed as the "parameters" value
    // to any nested stacks.
    customStackParams[ResourceConstants.PARAMETERS.AppSyncApiId] = Fn.GetAtt(
        ResourceConstants.RESOURCES.GraphQLAPILogicalID,
        'ApiId'
    );

    // Load the root stack's parameters as we will update them with the Child Stack's parameters
    // if they are not already present in the root stack.
    let updatedParameters = rootStack.Parameters;

    for (const userStack of Object.keys(userStacks)) {
        if (transformOutput.stacks[userStack]) {
            throw new Error(`You cannot provide a stack named ${userStack} as it \
            will be overwritten by a stack generated by the GraphQL Transform.`)
        }
        const userDefinedStack = userConfig.stacks[userStack];

        /**
         * First loop through the parameters in the user defined stack and see
         * if there are any Parameters that are present in the child but not the
         * root stack - if so, add it to the root stack.
         */
        for (const key of Object.keys(userDefinedStack.Parameters)) {
            if (customStackParams[key] == null) {
                customStackParams[key] = Fn.Ref(key);
                /**
                 * First check to the ensure that the key does not already exist in the Root stack
                 * This helps to prevent the customer from overwriting parameters that are used by the library
                 */
                if (updatedParameters[key]) {
                    throw new Error(`Cannot redefine CloudFormation parameter ${key} in stack ${userStack}.`);
                } else {
                    // Add the entire parameter entry from the user defined stack's parameter
                    updatedParameters[key] = userDefinedStack.Parameters[key];
                }
            }
        }
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

    // Update the Root Stack Params since we have added the Child Stack Params if they are missing.
    rootStack.Parameters = updatedParameters;
    return {
        ...transformOutput,
        resolvers: transformResolvers,
        stacks: transformStacks
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
        await walkDirPosix(opts.directory, opts.upload)
    } catch (e) {
        throw e
    }
}

/**
 * Writes a deployment to disk at a path.
 */
async function writeDeploymentToDisk(deployment: DeploymentResources, directory: string, rootStackFileName: string = 'rootStack.json') {

    // Delete the last deployments resources.
    await emptyDirectory(directory)

    // Write the schema to disk
    const schema = deployment.schema;
    const fullSchemaPath = path.normalize(directory + `/schema.graphql`)
    fs.writeFileSync(fullSchemaPath, schema)

    // Setup the directories if they do not exist.
    initStacksAndResolversDirectories(directory);

    // Write resolvers to disk
    const resolverFileNames = Object.keys(deployment.resolvers);
    const resolverRootPath = resolverDirectoryPath(directory)
    for (const resolverFileName of resolverFileNames) {
        const fullResolverPath = path.normalize(resolverRootPath + '/' + resolverFileName);
        fs.writeFileSync(fullResolverPath, deployment.resolvers[resolverFileName]);
    }

    // Write pipeline resolvers to disk
    const pipelineFunctions = Object.keys(deployment.pipelineFunctions);
    const pipelineFunctionRootPath = pipelineFunctionDirectoryPath(directory)
    for (const functionFileName of pipelineFunctions) {
        const fullTemplatePath = path.normalize(pipelineFunctionRootPath + '/' + functionFileName);
        fs.writeFileSync(fullTemplatePath, deployment.pipelineFunctions[functionFileName]);
    }

    // Write the stacks to disk
    const stackNames = Object.keys(deployment.stacks);
    const stackRootPath = stacksDirectoryPath(directory)
    for (const stackFileName of stackNames) {
        const fileNameParts = stackFileName.split('.');
        if (fileNameParts.length === 1) {
            fileNameParts.push('json')
        }
        const fullFileName = fileNameParts.join('.');
        throwIfNotJSONExt(fullFileName);
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

interface MigrationOptions {
    projectDirectory: string,
    cloudBackendDirectory?: string,
}
/**
 * Using the current cloudbackend as the source of truth of the current env,
 * move the deployment forward to the intermediate stage before allowing the
 * rest of the deployment to take place.
 * @param opts
 */
export async function migrateAPIProject(opts: MigrationOptions) {
    const projectDirectory = opts.projectDirectory;
    const cloudBackendDirectory = opts.cloudBackendDirectory || projectDirectory;

    // Read the existing project structures from both the current cloud directory
    // and the current project environment.
    const copyOfCloudBackend = await readFromPath(cloudBackendDirectory);
    if (copyOfCloudBackend.build && !copyOfCloudBackend.build[CLOUDFORMATION_FILE_NAME]) {
        copyOfCloudBackend.build[CLOUDFORMATION_FILE_NAME] = copyOfCloudBackend[CLOUDFORMATION_FILE_NAME];
    }
    const projectConfig = await readFromPath(projectDirectory);

    // Perform the intermediate migration.
    const cloudBackendConfig = await readV1ProjectConfiguration(cloudBackendDirectory);
    const transformConfig = makeTransformConfigFromOldProject(cloudBackendConfig);
    await updateToIntermediateProject(projectDirectory, cloudBackendConfig, transformConfig);

    // Return the old project structures in case of revert.
    return {
        project: projectConfig,
        cloudBackend: copyOfCloudBackend
    }
}
export async function revertAPIMigration(directory: string, oldProject: AmplifyApiV1Project) {
    await fs.remove(directory);
    await writeToPath(directory, oldProject);
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
    const cloudFormationTemplateExists = await fs.exists(cloudFormationTemplatePath);
    if (!cloudFormationTemplateExists) {
        throw new Error(`Could not find cloudformation template at ${cloudFormationTemplatePath}`);
    }
    const cloudFormationTemplateStr = await fs.readFile(cloudFormationTemplatePath);
    const cloudFormationTemplate = JSON.parse(cloudFormationTemplateStr.toString());

    // Get the params
    const parametersFilePath = path.join(projectDirectory, 'parameters.json');
    const parametersFileExists = await fs.exists(parametersFilePath);
    if (!parametersFileExists) {
        throw new Error(`Could not find parameters.json at ${parametersFilePath}`);
    }
    const parametersFileStr = await fs.readFile(parametersFilePath);
    const parametersFile = JSON.parse(parametersFileStr.toString());

    return {
        template: cloudFormationTemplate,
        parameters: parametersFile,
        schema
    }
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
            case 'AWS::IAM::Role': {
                if (key === 'ElasticSearchAccessIAMRole') {
                    // A special case for deploying the migration to projects with @searchable.
                    // This keeps an IAM role needed by the old ES policy document around.
                    migrationResourceIds.push(key);
                }
                break;
            }
            default: {
                break;
            }
        }
    }
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
 * Updates the project to a temporary configuration that stages the real migration.
 */
async function updateToIntermediateProject(projectDirectory: string, project: AmplifyApiV1Project, config: TransformConfig) {
    // Write the config to disk.
    await writeConfig(projectDirectory, config);

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

    const filteredParameterValues = {
        DynamoDBBillingMode: 'PROVISIONED'
    };
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
    if (fs.existsSync(oldCloudFormationTemplatePath)) {
        fs.unlinkSync(oldCloudFormationTemplatePath);
    }

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
    const resolverRootPath = resolverDirectoryPath(directory)
    if (!fs.existsSync(resolverRootPath)) {
        fs.mkdirSync(resolverRootPath);
    }
    const pipelineFunctionRootPath = pipelineFunctionDirectoryPath(directory);
    if (!fs.existsSync(pipelineFunctionRootPath)) {
        fs.mkdirSync(pipelineFunctionRootPath);
    }
    const stackRootPath = stacksDirectoryPath(directory)
    if (!fs.existsSync(stackRootPath)) {
        fs.mkdirSync(stackRootPath);
    }
}

function pipelineFunctionDirectoryPath(rootPath: string) {
    return path.normalize(rootPath + `/pipelineFunctions`)
}

function resolverDirectoryPath(rootPath: string) {
    return path.normalize(rootPath + `/resolvers`)
}

function stacksDirectoryPath(rootPath: string) {
    return path.normalize(rootPath + `/stacks`)
}

function getOrDefault(o: any, k: string, d: any) {
    return o[k] || d;
}
