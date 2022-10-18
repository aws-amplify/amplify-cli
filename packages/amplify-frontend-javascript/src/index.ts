import path from 'path';
import fs from 'fs-extra';

import { $TSAny, $TSContext } from 'amplify-cli-core';
import initializer from './initializer';
import projectScanner from './project-scanner';
import configManager from './configuration-manager';
import server from './server';
import publisher from './publisher';
import constants from './constants';
import {
  createAWSExports, getAWSExports, deleteAmplifyConfig, generateAwsExportsAtPath,
} from './frontend-config-creator';

const pluginName = 'javascript';

const emptyAwsExportsPath = path.join(__dirname, 'lib', 'aws-exports.empty.js');

/**
 Scan the project
 */
export const scanProject = (projectPath): number => projectScanner.run(projectPath);

/**
 Init the project
 */
export const init = (context): Promise<void> => initializer.run(context);

/**
 Project has been initialized
 */
export const onInitSuccessful = (context): $TSContext => initializer.onInitSuccessful(context);

/**
 * This function enables export to write these files to an external path
 * @param {$TSContext} context the context
 * @param {metaWithOutput} amplifyResources amplify resources
 * @param {cloudMetaWithOutput} amplifyCloudResources amplify cloud resources
 * @param {string} exportPath path to where the files need to be written
 */
export const createFrontendConfigsAtPath = async (context, amplifyResources, amplifyCloudResources, exportPath): Promise<void> => {
  const newOutputsForFrontend = amplifyResources.outputsForFrontend;
  const cloudOutputsForFrontend = amplifyCloudResources.outputsForFrontend;

  const amplifyConfig = await getAWSExports(context, newOutputsForFrontend, cloudOutputsForFrontend);
  generateAwsExportsAtPath(context, path.join(exportPath, constants.exportsFilename), amplifyConfig);
};

/**
 Create frontend configurations
 */
export const createFrontendConfigs = async (context, amplifyResources, amplifyCloudResources): Promise<$TSContext> => {
  const newOutputsForFrontend = amplifyResources.outputsForFrontend;
  const cloudOutputsForFrontend = amplifyCloudResources.outputsForFrontend;
  // createAmplifyConfig(context, outputsByCategory);
  return createAWSExports(context, newOutputsForFrontend, cloudOutputsForFrontend);
};

/**
 Set frontend defaults based on guessed framework
 */
export const setFrontendDefaults = (context, projectPath): void => configManager.setFrontendDefaults(context, projectPath);

/**
 Display frontend defaults
 */
export const displayFrontendDefaults = (context, projectPath): void => configManager.displayFrontendDefaults(context, projectPath);

/**
 Create aws-exports.js file
 */
export const initializeAwsExports = (destDir): void => {
  const dest = path.resolve(destDir, 'aws-exports.js');
  if (!fs.existsSync(dest)) {
    fs.copySync(emptyAwsExportsPath, dest);
  }
};

/**
 Configure the project
 */
export const configure = (context): Promise<void> => configManager.configure(context);

/**
 Publish the project
 */
export const publish = (context): Promise<$TSAny> => publisher.run(context);

/**
 Run the server
 */
export const run = (context): Promise<void> => server.run(context);

/**
 Execute a amplify command
 */
export const executeAmplifyCommand = async (context): Promise<$TSAny> => {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, pluginName);
  } else {
    commandPath = path.join(commandPath, pluginName, context.input.command);
  }

  type CommandModule = {
    run
  }
  const commandModule: Promise<CommandModule> = import(commandPath);
  (await commandModule).run(context);
};

/**
 Amplify event handler
 */
export const handleAmplifyEvent = async (context, args): Promise<void> => {
  context.print.info(`${pluginName} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
};

export default {
  constants,
  scanProject,
  init,
  onInitSuccessful,
  configure,
  displayFrontendDefaults,
  setFrontendDefaults,
  publish,
  run,
  createFrontendConfigs,
  createFrontendConfigsAtPath,
  initializeAwsExports,
  executeAmplifyCommand,
  handleAmplifyEvent,
  deleteConfig: deleteAmplifyConfig,
};
