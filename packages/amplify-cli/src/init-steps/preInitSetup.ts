import {
  $TSContext, exitOnNextTick, getPackageManager, NonEmptyDirectoryError, pathManager,
} from 'amplify-cli-core';
import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as url from 'url';
import { generateLocalEnvInfoFile } from './s9-onSuccess';

/**
 * Executes before init
 */
export const preInitSetup = async (context: $TSContext): Promise<$TSContext> => {
  if (context.parameters.options.app) {
    // Setting up a sample app
    context.print.warning('Note: Amplify does not have knowledge of the url provided');
    const repoUrl = context.parameters.options.app;

    await validateGithubRepo(context, repoUrl);
    await cloneRepo(context, repoUrl);
    cleanAmplifyArtifacts();
    await installPackage();
    await setLocalEnvDefaults(context);
  }
  return context;
};

/**
 * Checks whether a url is a valid remote github repository
 *
 * @throws error if url is not a valid remote github url
 */
const validateGithubRepo = async (context: $TSContext, repoUrl: string): Promise<void> => {
  try {
    url.parse(repoUrl);

    execSync(`git ls-remote ${repoUrl}`, { stdio: 'ignore' });
  } catch (e) {
    context.print.error('Invalid remote github url');
    await context.usageData.emitError(e);
    exitOnNextTick(1);
  }
};

/**
 * Clones repo from url to current directory (must be empty)
 */
const cloneRepo = async (context: $TSContext, repoUrl: string): Promise<void> => {
  const files = fs.readdirSync(process.cwd());

  if (files.length > 0) {
    const errMessage = 'Please ensure you run this command in an empty directory';
    context.print.error(errMessage);
    await context.usageData.emitError(new NonEmptyDirectoryError(errMessage));
    exitOnNextTick(1);
  }

  try {
    execSync(`git clone ${repoUrl} .`, { stdio: 'inherit' });
  } catch (e) {
    await context.usageData.emitError(e);
    exitOnNextTick(1);
  }
};

/**
 * Install package using the correct package manager if package handling file exists
 */
const installPackage = (): void => {
  const packageManager = getPackageManager();

  if (packageManager !== null) {
    execSync(`${packageManager.executable} install`, { stdio: 'inherit' });
  }
};

/**
 * Set the default environment and editor for the local env
 */
const setLocalEnvDefaults = async (context: $TSContext): Promise<void> => {
  const projectPath = process.cwd();
  const defaultEditor = 'vscode';
  // eslint-disable-next-line spellcheck/spell-checker
  const envName = 'sampledev';
  context.print.warning(`Setting default editor to ${defaultEditor}`);
  context.print.warning(`Setting environment to ${envName}`);
  context.print.warning('Run amplify configure project to change the default configuration later');

  context.exeInfo.localEnvInfo = {
    projectPath,
    defaultEditor,
    envName,
  };

  context.exeInfo.inputParams.amplify.envName = envName;

  generateLocalEnvInfoFile(context);
};

/**
 * After cloning a project, remove the environment specific, perhaps accidentally checked in Amplify state files
 * to make sure further commands will run correctly, like 'amplify delete'
 */
const cleanAmplifyArtifacts = (): void => {
  const projectPath = process.cwd();

  fs.removeSync(pathManager.getAmplifyMetaFilePath(projectPath));
  fs.removeSync(pathManager.getTeamProviderInfoFilePath(projectPath));
  fs.removeSync(pathManager.getLocalAWSInfoFilePath(projectPath));
  fs.removeSync(pathManager.getLocalEnvFilePath(projectPath));
};
