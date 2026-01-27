const fs = require('fs-extra');
const path = require('path');
const { pathManager } = require('@aws-amplify/amplify-cli-core');
const { compareVtlFilesDetailed } = require('./compare-vtl');
const { hashElement } = require('folder-hash');

/**
 * Constants for AppSync deployment optimization
 */
const CLOUDFORMATION_TEMPLATE_FILENAME = 'cloudformation-template.json';
const BUILD_DIRECTORY = 'build';
const STACKS_DIRECTORY = 'stacks';
const NESTED_STACK_TYPE = 'AWS::CloudFormation::Stack';
const APPSYNC_FUNCTION_TYPE = 'AWS::AppSync::FunctionConfiguration';
const S3_LOCATION_JOIN_INDEX = 3;
const ROOT_APPSYNC_S3_KEY = 'amplify-appsync-files';

/**
 * Optimizes AppSync resolver deployment by reusing unchanged VTL templates
 * @param {Object} context - Amplify context object
 * @param {string} category - Resource category
 * @param {string} resourceName - Resource name
 * @param {string} resourceBuildDir - Build directory path
 * @param {string} deploymentRootKey - Deployment root key for S3
 * @param {boolean} [useDeprecatedParameters=false] - Flag to use deprecated parameters for deployment key
 * @returns {Promise<void>}
 */
async function optimizeAppSyncResolverDeployment(
  context,
  category,
  resourceName,
  resourceBuildDir,
  deploymentRootKey,
  useDeprecatedParameters = false,
) {
  try {
    const currentBackEndDir = pathManager.getCurrentCloudBackendDirPath();
    const currentResourceDirectoryPath = path.join(currentBackEndDir, category, resourceName);

    // Validate prerequisites
    const validationResult = await validateDeploymentPrerequisites(
      context,
      resourceName,
      resourceBuildDir,
      currentResourceDirectoryPath,
      useDeprecatedParameters,
    );

    if (!validationResult.isValid) {
      return;
    }

    const { oldDeploymentRootKey, cfFilePath, oldCfFilePath } = validationResult;

    context.print.info(`Optimizing AppSync resolver deployment for ${resourceName}...`);
    context.print.debug(`Previous deployment key: ${oldDeploymentRootKey || 'none'}`);
    context.print.debug(`Current deployment key: ${deploymentRootKey}`);

    // Process CloudFormation templates
    await processCloudFormationTemplates(
      cfFilePath,
      oldCfFilePath,
      currentResourceDirectoryPath,
      resourceBuildDir,
      oldDeploymentRootKey || deploymentRootKey,
      context,
    );

    context.print.success(`Successfully optimized resolver deployment for ${resourceName}`);
  } catch (error) {
    context.print.error(`Failed to optimize AppSync deployment: ${error.message}`);
    throw error;
  }
}

/**
 * Validates deployment prerequisites
 * @private
 */
async function validateDeploymentPrerequisites(
  context,
  resourceName,
  resourceBuildDir,
  currentResourceDirectoryPath,
  useDeprecatedParameters,
) {
  const cfFilePath = resourceBuildDir ? path.join(resourceBuildDir, CLOUDFORMATION_TEMPLATE_FILENAME) : undefined;

  if (!cfFilePath || !fs.existsSync(cfFilePath)) {
    context.print.error(`CloudFormation template not found in build directory for resource: ${resourceName}`);
    return { isValid: false };
  }

  const oldCfFilePath = path.join(currentResourceDirectoryPath, BUILD_DIRECTORY, CLOUDFORMATION_TEMPLATE_FILENAME);

  let oldDeploymentRootKey = null;

  if (isExistingDeployment(currentResourceDirectoryPath)) {
    oldDeploymentRootKey = await getDeploymentRootKey(currentResourceDirectoryPath, useDeprecatedParameters);
  }

  return {
    isValid: true,
    oldDeploymentRootKey,
    cfFilePath,
    oldCfFilePath,
  };
}

/**
 * Checks if a deployment already exists
 * @private
 */
function isExistingDeployment(directoryPath) {
  return fs.existsSync(directoryPath) && fs.readdirSync(directoryPath).length !== 0;
}

/**
 * Processes CloudFormation templates to optimize resolver uploads
 * @private
 */
async function processCloudFormationTemplates(
  cfFilePath,
  oldCfFilePath,
  currentResourceDirectoryPath,
  resourceBuildDir,
  deploymentRootKey,
  context,
) {
  const cfTemplate = readJsonFile(cfFilePath);
  const oldCfTemplate = readJsonFile(oldCfFilePath);

  if (!cfTemplate.Resources) {
    context.print.debug('No resources found in CloudFormation template');
    return;
  }

  for (const [stackName, stackResource] of Object.entries(cfTemplate.Resources)) {
    if (stackResource.Type === NESTED_STACK_TYPE) {
      await processNestedStack(stackName, currentResourceDirectoryPath, resourceBuildDir, deploymentRootKey, context);
    }
  }
}

/**
 * Processes a nested stack for resolver optimization
 * @private
 */
async function processNestedStack(stackName, currentResourceDirectoryPath, resourceBuildDir, deploymentRootKey, context) {
  const oldStackPath = path.join(currentResourceDirectoryPath, BUILD_DIRECTORY, STACKS_DIRECTORY, `${stackName}.json`);

  const newStackPath = path.join(resourceBuildDir, STACKS_DIRECTORY, `${stackName}.json`);

  if (!fs.existsSync(oldStackPath)) {
    context.print.info(`New nested stack detected: ${stackName} - will upload to ${deploymentRootKey}/stacks/${stackName}.json`);
    return;
  }

  const newNestedStack = readJsonFile(newStackPath);
  const oldNestedStack = readJsonFile(oldStackPath);

  const updatedStack = await optimizeNestedStackResolvers(
    newNestedStack,
    oldNestedStack,
    stackName,
    currentResourceDirectoryPath,
    resourceBuildDir,
    deploymentRootKey,
    context,
  );

  writeJsonFile(newStackPath, updatedStack);
}

/**
 * Optimizes AppSync resolvers within a nested stack
 * @private
 */
async function optimizeNestedStackResolvers(
  newNestedStack,
  oldNestedStack,
  stackName,
  currentResourceDirectoryPath,
  resourceBuildDir,
  deploymentRootKey,
  context,
) {
  if (!newNestedStack.Resources) {
    return newNestedStack;
  }

  for (const [functionName, functionResource] of Object.entries(newNestedStack.Resources)) {
    if (functionResource.Type !== APPSYNC_FUNCTION_TYPE) {
      continue;
    }

    const oldFunction = oldNestedStack.Resources?.[functionName];

    if (!oldFunction) {
      context.print.info(`New AppSync function detected: ${functionName} in stack ${stackName}`);
      continue;
    }

    await optimizeResolverTemplates(
      functionResource,
      oldFunction,
      functionName,
      stackName,
      currentResourceDirectoryPath,
      resourceBuildDir,
      deploymentRootKey,
      context,
    );
  }

  return newNestedStack;
}

/**
 * Optimizes request and response mapping templates for a resolver
 * @private
 */
async function optimizeResolverTemplates(
  newFunction,
  oldFunction,
  functionName,
  stackName,
  currentResourceDirectoryPath,
  resourceBuildDir,
  deploymentRootKey,
  context,
) {
  // Optimize request mapping template
  optimizeMappingTemplate(
    newFunction,
    oldFunction,
    'RequestMappingTemplateS3Location',
    functionName,
    stackName,
    currentResourceDirectoryPath,
    resourceBuildDir,
    deploymentRootKey,
    context,
  );

  // Optimize response mapping template if exists
  if (newFunction.Properties.ResponseMappingTemplateS3Location) {
    optimizeMappingTemplate(
      newFunction,
      oldFunction,
      'ResponseMappingTemplateS3Location',
      functionName,
      stackName,
      currentResourceDirectoryPath,
      resourceBuildDir,
      deploymentRootKey,
      context,
    );
  }
}

/**
 * Optimizes a single mapping template (request or response)
 * @private
 */
function optimizeMappingTemplate(
  newFunction,
  oldFunction,
  templateType,
  functionName,
  stackName,
  currentResourceDirectoryPath,
  resourceBuildDir,
  deploymentRootKey,
  context,
) {
  const oldLocation = oldFunction.Properties[templateType];
  const newLocation = newFunction.Properties[templateType];

  if (!oldLocation || !newLocation) {
    return;
  }

  const oldFileName = extractFileNameFromS3Location(oldLocation);
  const newFileName = extractFileNameFromS3Location(newLocation);

  const oldFilePath = path.join(currentResourceDirectoryPath, BUILD_DIRECTORY, oldFileName);
  const newFilePath = path.join(resourceBuildDir, newFileName);

  if (!fs.existsSync(oldFilePath)) {
    context.print.info(`New ${templateType} template for function ${functionName} in stack ${stackName}`);
    return;
  }

  const changes = compareVtlFilesDetailed(oldFilePath, newFilePath);

  if (changes.hasChanges) {
    context.print.info(
      `Changed ${templateType} for function ${functionName} in stack ${stackName}: ` + `${JSON.stringify(changes.changes, null, 2)}`,
    );
  } else {
    // Reuse existing S3 location to avoid re-upload
    reuseExistingS3Location(newFunction.Properties[templateType], oldLocation, deploymentRootKey);

    context.print.debug(`Reusing unchanged ${templateType} for function ${functionName}`);
  }
}

/**
 * Extracts filename from S3 location object
 * @private
 */
function extractFileNameFromS3Location(s3Location) {
  const joinArray = s3Location['Fn::Join']?.[1];
  if (!joinArray || !Array.isArray(joinArray)) {
    throw new Error('Invalid S3 location format');
  }
  return joinArray[joinArray.length - 1];
}

/**
 * Reuses existing S3 location for unchanged templates
 * @private
 */
function reuseExistingS3Location(newLocation, oldLocation, deploymentRootKey) {
  const oldJoinArray = oldLocation['Fn::Join']?.[1];
  const newJoinArray = newLocation['Fn::Join']?.[1];

  if (!oldJoinArray || !newJoinArray) {
    return;
  }

  // Preserve existing S3 key or use deployment root key
  if (typeof oldJoinArray[S3_LOCATION_JOIN_INDEX] === 'string') {
    newJoinArray[S3_LOCATION_JOIN_INDEX] = oldJoinArray[S3_LOCATION_JOIN_INDEX];
  } else {
    newJoinArray[S3_LOCATION_JOIN_INDEX] = deploymentRootKey;
  }
}

/**
 * Reads and parses a JSON file
 * @private
 */
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * Writes a JSON file with proper formatting
 * @private
 */
function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`Failed to write JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * Hashes the project directory into a single value. The same project configuration
 * should return the same hash.
 */
async function hashDirectory(directory) {
  const options = {
    encoding: 'hex',
    folders: {
      exclude: ['build'],
    },
  };

  const hashResult = await hashElement(directory, options);

  return hashResult.hash;
}

/**
 * Generates deployment root key based on directory hash
 * @private
 */
async function getDeploymentRootKey(resourceDir, useDeprecatedParameters) {
  let deploymentSubKey;
  if (useDeprecatedParameters) {
    deploymentSubKey = new Date().getTime();
  } else {
    deploymentSubKey = await hashDirectory(resourceDir);
  }
  const deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${deploymentSubKey}`;
  return deploymentRootKey;
}

module.exports = {
  optimizeAppSyncResolverDeployment,
};
