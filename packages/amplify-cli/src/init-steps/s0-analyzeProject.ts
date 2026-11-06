import { $TSContext, AmplifyError, LocalEnvInfo, stateManager } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';
import * as path from 'path';
import { amplifyCLIConstants } from '../extensions/amplify-helpers/constants';
import { editors, editorSelection, normalizeEditor } from '../extensions/amplify-helpers/editor-selection';
import { getFrontendPlugins } from '../extensions/amplify-helpers/get-frontend-plugins';
import { isProjectNameValid, normalizeProjectName } from '../extensions/amplify-helpers/project-name-validation';
import { getSuitableFrontend } from './s1-initFrontend';

/**
 * Analyzes the project
 */
export const analyzeProjectHeadless = async (context: $TSContext): Promise<void> => {
  const projectPath = process.cwd();
  const projectName = path.basename(projectPath);
  const env = getDefaultEnv(context);
  setProjectConfig(context, projectName);
  setExeInfo(context, projectPath, undefined, env);
  // default behavior in quick start used to be android.
  // default to that here unless different param specified
  const { frontend } = context?.parameters?.options ?? {};
  if (!frontend) {
    context.print.warning('No frontend specified. Defaulting to android.');
    context.exeInfo.projectConfig.frontend = 'android';
  } else {
    context.exeInfo.projectConfig.frontend = frontend;
  }
};

/**
 * defaultEnv: string | undefined - this is an accurate type description based on what the code does,
 * but this might indicate an unhandled edge case
 */
export const displayConfigurationDefaults = (
  context: $TSContext,
  defaultProjectName: string,
  defaultEnv: string | undefined,
  defaultEditorName: string,
): void => {
  context.print.info('Project information');
  context.print.info(`| Name: ${defaultProjectName}`);
  context.print.info(`| Environment: ${defaultEnv}`);
  context.print.info(`| Default editor: ${defaultEditorName}`);
};

const setConfigurationDefaults = (
  context: $TSContext,
  projectPath: string,
  defaultProjectName: string,
  defaultEnv: string | undefined,
  defaultEditor: string,
): void => {
  setExeInfo(context, projectPath, defaultEditor, defaultEnv);
  setProjectConfig(context, defaultProjectName);
  context.exeInfo.inputParams.amplify = context.exeInfo.inputParams.amplify || {};
  context.exeInfo.inputParams.amplify.projectName = defaultProjectName;
  context.exeInfo.inputParams.amplify.envName = defaultEnv;
  context.exeInfo.inputParams.amplify.defaultEditor = defaultEditor;
};

const displayAndSetDefaults = async (context: $TSContext, projectPath: string, projectName: string): Promise<void> => {
  const defaultProjectName = projectName;
  const defaultEnv = getDefaultEnv(context);
  let defaultEditor;
  if (context?.exeInfo?.inputParams?.amplify?.defaultEditor) {
    defaultEditor = normalizeEditor(context.exeInfo.inputParams.amplify.defaultEditor);
  } else {
    defaultEditor = editors.length > 0 ? editors[0].value : 'vscode';
  }
  const editorIndex = editors.findIndex((editorEntry) => editorEntry.value === defaultEditor);
  const defaultEditorName = editorIndex > -1 ? editors[editorIndex].name : 'Visual Studio Code';

  context.print.success('The following configuration will be applied:');
  context.print.info('');

  displayConfigurationDefaults(context, defaultProjectName, defaultEnv, defaultEditorName);

  const frontendPlugins = getFrontendPlugins(context);
  const defaultFrontend = getSuitableFrontend(context, frontendPlugins, projectPath);
  const frontendModule = await import(frontendPlugins[defaultFrontend]);

  await frontendModule.displayFrontendDefaults(context, projectPath);
  context.print.info('');

  if (context.exeInfo.inputParams.yes || (await context.amplify.confirmPrompt('Initialize the project with the above configuration?'))) {
    setConfigurationDefaults(context, projectPath, defaultProjectName, defaultEnv, defaultEditorName);
    await frontendModule.setFrontendDefaults(context, projectPath);
  }
};

/**
 * Pre-init setup
 */
export const analyzeProject = async (context: $TSContext): Promise<$TSContext> => {
  // eslint-disable-next-line spellcheck/spell-checker
  if (!context.parameters.options?.app || !context.parameters.options?.quickstart) {
    context.print.warning('Note: It is recommended to run this command from the root of your app directory');
  }
  const projectPath = process.cwd();
  context.exeInfo.isNewProject = isNewProject(context);
  context.exeInfo.forcePush = !!context?.parameters?.options?.forcePush;
  const projectName = await getProjectName(context);

  if (context.exeInfo.isNewProject && context.parameters.command !== 'env') {
    await displayAndSetDefaults(context, projectPath, projectName);
  }

  if (
    !context.exeInfo.isNewProject &&
    context.parameters.options &&
    context.parameters.options.yes &&
    !context.exeInfo.inputParams.amplify?.envName
  ) {
    throw new AmplifyError('ProjectInitError', {
      message: `Amplify project ${stateManager.getAppID()} is already initialized for environment ${stateManager.getCurrentEnvName(
        projectPath,
      )}`,
      resolution: 'To create a new environment run `amplify add env`',
    });
  }

  const envName = await getEnvName(context);

  let defaultEditor = getDefaultEditor();

  if (!defaultEditor) {
    defaultEditor = await getEditor(context);
  }

  context.exeInfo.isNewEnv = isNewEnv(envName);
  context.exeInfo.forcePush = !!context?.parameters?.options?.forcePush;

  // If it is a new env and we have an existing environment save that name so
  // it can be used to gather resource information like env specific to clone import resources
  if (context.exeInfo.isNewEnv && !context.exeInfo.isNewProject) {
    const currentLocalEnvInfo = stateManager.getLocalEnvInfo(undefined, {
      throwIfNotExist: false,
    });

    if (currentLocalEnvInfo) {
      context.exeInfo.sourceEnvName = currentLocalEnvInfo.envName;
    }
  }

  setProjectConfig(context, projectName);
  setExeInfo(context, projectPath, defaultEditor, envName);

  return context;
};

const setProjectConfig = (context: $TSContext, projectName: string): void => {
  context.exeInfo.isNewProject = isNewProject(context);
  context.exeInfo.projectConfig = {
    ...context.exeInfo.projectConfig,
    projectName,
    version: amplifyCLIConstants.CURRENT_PROJECT_CONFIG_VERSION,
  };
};

const setExeInfo = (context: $TSContext, projectPath: string, defaultEditor?: string, envName?: string): $TSContext => {
  context.exeInfo.localEnvInfo = {
    projectPath,
    defaultEditor,
    envName,
  } as unknown as LocalEnvInfo;
  context.exeInfo.teamProviderInfo = {};

  return context;
};

const getProjectName = async (context: $TSContext): Promise<string> => {
  let projectName;
  const projectPath = process.cwd();

  if (!context.exeInfo.isNewProject) {
    const projectConfig = stateManager.getProjectConfig(projectPath);

    projectName = projectConfig.projectName;

    return projectName;
  }

  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.projectName) {
    projectName = normalizeProjectName(context.exeInfo.inputParams.amplify.projectName);
  } else {
    projectName = normalizeProjectName(path.basename(projectPath));

    if (!context.exeInfo.inputParams.yes) {
      const projectNameQuestion: inquirer.InputQuestion = {
        type: 'input',
        name: 'inputProjectName',
        message: 'Enter a name for the project',
        default: projectName,
        validate: (input) => isProjectNameValid(input) || 'Project name should be between 3 and 20 characters and alphanumeric',
      };

      const answer = await inquirer.prompt(projectNameQuestion);

      projectName = answer.inputProjectName;
    }
  }

  return projectName;
};

const getEditor = async (context: $TSContext): Promise<string> => {
  let editor;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
    editor = normalizeEditor(context.exeInfo.inputParams.amplify.defaultEditor);
  } else if (!context.exeInfo.inputParams.yes) {
    editor = await editorSelection(editor);
  }

  if (!editor) {
    editor = context.exeInfo.localEnvInfo?.defaultEditor;
  }

  return editor;
};

const isEnvNameValid = (inputEnvName: string): boolean => /^[a-z]{2,10}$/.test(inputEnvName);

const INVALID_ENV_NAME_MSG = 'Environment name must be between 2 and 10 characters, and lowercase only.';

const getDefaultEnv = (context: $TSContext): string | undefined => {
  let defaultEnv = 'dev';

  if (context?.exeInfo?.inputParams?.amplify?.envName) {
    if (isEnvNameValid(context.exeInfo.inputParams.amplify.envName)) {
      defaultEnv = context.exeInfo.inputParams.amplify.envName;
      return defaultEnv;
    }
    throw new AmplifyError('EnvironmentNameError', {
      message: `Invalid environment name: ${context.exeInfo.inputParams.amplify.envName}`,
      resolution: INVALID_ENV_NAME_MSG,
    });
  }

  if (isNewProject(context) || !context.amplify.getAllEnvs().includes(defaultEnv)) {
    return defaultEnv;
  }
  return undefined;
};

const getEnvName = async (context: $TSContext): Promise<string> => {
  let envName;

  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.envName) {
    if (isEnvNameValid(context.exeInfo.inputParams.amplify.envName)) {
      ({ envName } = context.exeInfo.inputParams.amplify);
      return envName;
    }
    throw new AmplifyError('ProjectInitError', {
      message: `Invalid environment name: ${context.exeInfo.inputParams.amplify.envName}`,
      resolution: INVALID_ENV_NAME_MSG,
    });
  } else if (context.exeInfo.inputParams && context.exeInfo.inputParams.yes) {
    const existingAppId = stateManager.getAppID();
    const existingEnvName = stateManager.getCurrentEnvName();
    throw new AmplifyError('ProjectInitError', {
      message: `Environment ${existingEnvName} is already initialized for Amplify project ${existingAppId}`,
      resolution: 'To create a new environment run `amplify add env`',
    });
  }

  const newEnvQuestion = async (): Promise<void> => {
    const defaultEnvName = getDefaultEnv(context);
    const envNameQuestion: inquirer.InputQuestion = {
      type: 'input',
      name: 'envName',
      message: 'Enter a name for the environment',
      default: defaultEnvName,
      validate: (input) => (!isEnvNameValid(input) ? INVALID_ENV_NAME_MSG : true),
    };

    ({ envName } = await inquirer.prompt(envNameQuestion));
  };

  if (isNewProject(context)) {
    await newEnvQuestion();
  } else {
    const allEnvs = context.amplify.getAllEnvs();
    const envAddExec = checkEnvAddExec(context);

    if (allEnvs.length > 0 && envAddExec === false) {
      if (await context.amplify.confirmPrompt('Do you want to use an existing environment?')) {
        const envQuestion: inquirer.ListQuestion = {
          type: 'list',
          name: 'envName',
          message: 'Choose the environment you would like to use:',
          choices: allEnvs,
        };

        ({ envName } = await inquirer.prompt(envQuestion));
      } else {
        await newEnvQuestion();
      }
    } else if (envAddExec === true && context.parameters.first) {
      envName = context.parameters.first;
    } else {
      await newEnvQuestion();
    }
  }

  return envName;
};

/**
 * TODO this currently checks both local-aws-info and team-provider-info for environments
 *
 * We need to remove the check from team-provider-info and instead use a service call
 * but this is a breaking change because it means that some init flows will now require additional arguments to correctly
 * attach to existing environments.
 * Specifically we need the appId, region and AWS credentials to make a service call to get existing environments
 *
 * Most likely we should make a breaking change for this where init can no longer be use to pull existing projects and instead customers
 * can only use pull for this use case
 * @param envName the envName to check
 * @returns whether the env already exists
 */
const isNewEnv = (envName: string): boolean => {
  const cwd = process.cwd();
  const readOptions = { throwIfNotExist: false, default: {} };
  const localAwsInfoEnvs = Object.keys(stateManager.getLocalAWSInfo(cwd, readOptions));
  const tpiEnvs = Object.keys(stateManager.getTeamProviderInfo(cwd, readOptions));
  const allEnvs = Array.from(new Set([...localAwsInfoEnvs, ...tpiEnvs]));
  return !allEnvs.includes(envName);
};

export const isNewProject = (context: $TSContext): boolean => {
  let newProject = true;
  const projectPath = process.cwd();
  const projectConfigFilePath = context.amplify.pathManager.getProjectConfigFilePath(projectPath);
  if (fs.existsSync(projectConfigFilePath)) {
    newProject = false;
  }
  return newProject;
};

const getDefaultEditor = (): string => {
  const projectPath = process.cwd();
  const localEnvInfo = stateManager.getLocalEnvInfo(projectPath, {
    throwIfNotExist: false,
    default: {},
  });

  return localEnvInfo.defaultEditor;
};

/**
 * Checks if `amplify env add` has been executed
 * @param {$TSContext} context The Amplify context object
 * @returns `boolean`
 */
const checkEnvAddExec = (context): boolean => context.parameters.command === 'env' && context.parameters.array[0] === 'add';
