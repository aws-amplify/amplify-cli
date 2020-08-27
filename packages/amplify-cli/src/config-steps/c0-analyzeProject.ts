import * as path from 'path';
import { editors, normalizeEditor } from '../extensions/amplify-helpers/editor-selection';
import { projectNameInput, editorSelect } from '../prompts';
import { isProjectNameValid, normalizeProjectName } from '../extensions/amplify-helpers/project-name-validation';
import { getEnvInfo } from '../extensions/amplify-helpers/get-env-info';
import { stateManager } from 'amplify-cli-core';

export async function analyzeProject(context) {
  context.exeInfo.projectConfig = stateManager.getProjectConfig(undefined, {
    throwIfNotExist: false,
  });

  context.exeInfo.localEnvInfo = getEnvInfo();

  const projectPath = process.cwd();
  Object.assign(context.exeInfo.localEnvInfo, { projectPath });

  await configureProjectName(context);
  await configureEditor(context);

  return context;
}

async function configureProjectName(context) {
  let { projectName } = context.exeInfo.projectConfig;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.projectName) {
    projectName = normalizeProjectName(context.exeInfo.inputParams.amplify.projectName);
  } else {
    if (!projectName) {
      const projectPath = process.cwd();
      projectName = normalizeProjectName(path.basename(projectPath));
    }
    if (!context.exeInfo.inputParams.yes) {
      projectName = await projectNameInput(projectName, isProjectNameValid);
    }
  }

  Object.assign(context.exeInfo.projectConfig, { projectName });
}

async function configureEditor(context) {
  let { defaultEditor } = context.exeInfo.localEnvInfo;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
    defaultEditor = normalizeEditor(context.exeInfo.inputParams.amplify.editor);
  } else if (!context.exeInfo.inputParams.yes) {
    defaultEditor = await editorSelect(editors, defaultEditor);
  }

  Object.assign(context.exeInfo.localEnvInfo, { defaultEditor });
}
