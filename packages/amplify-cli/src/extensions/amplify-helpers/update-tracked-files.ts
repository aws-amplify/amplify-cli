import * as path from 'path';
import fs from 'fs-extra';
import {
  $TSAny, JSONUtilities, pathManager, stateManager,
} from 'amplify-cli-core';

const {
  readJson,
} = JSONUtilities;

/**
 * Updates Cognito files that are tracked so that the diff is detected for an `amplify push`
 */
export const updateCognitoTrackedFiles = async (): Promise<void> => {
  const currentCloudBackendDir = pathManager.getCurrentCloudBackendDirPath();
  const localBackendDir = pathManager.getBackendDirPath();
  const amplifyMeta = stateManager.getMeta();
  const cognitoResource = stateManager.getResourceFromMeta(amplifyMeta, 'auth', 'Cognito', undefined, false);

  if (!fs.existsSync(currentCloudBackendDir) || !cognitoResource) {
    return;
  }

  const { resourceName } = cognitoResource;

  if (await detectCognitoDiff(currentCloudBackendDir, localBackendDir, resourceName)) {
    await addExtraLineToCliInputsJson(localBackendDir, resourceName);
  }
};

const detectCognitoDiff = async (
  currentCloudBackendDir: string,
  localBackendDir: string,
  resourceName: string,
): Promise<boolean> => detectCognitoAttributesRequireVerificationBeforeUpdateDiff(
  currentCloudBackendDir,
  localBackendDir,
  resourceName,
);

const detectCognitoAttributesRequireVerificationBeforeUpdateDiff = async (
  currentCloudBackendDir: string,
  localBackendDir: string,
  resourceName: string,
): Promise<boolean> => {
  const cloudBackendUserAttrUpdateSettings = await readCfnTemplateUserAttributeSettings(currentCloudBackendDir, resourceName);
  const backendUserAttrUpdateSettings = await readCfnTemplateUserAttributeSettings(localBackendDir, resourceName);
  const updateNotInCloudBackend: boolean = !cloudBackendUserAttrUpdateSettings?.AttributesRequireVerificationBeforeUpdate
    || cloudBackendUserAttrUpdateSettings?.AttributesRequireVerificationBeforeUpdate[0] !== 'email';
  const updateInLocalBackend: boolean = backendUserAttrUpdateSettings?.AttributesRequireVerificationBeforeUpdate.length === 1
    && backendUserAttrUpdateSettings?.AttributesRequireVerificationBeforeUpdate[0] === 'email';

  return updateNotInCloudBackend && updateInLocalBackend;
};

type UserAttributeUpdateSettings = {
  AttributesRequireVerificationBeforeUpdate: string[]
}

const readCfnTemplateUserAttributeSettings = async (
  backendDir: string,
  resourceName: string,
): Promise<UserAttributeUpdateSettings | undefined> => {
  const cfnTemplatePath = path.join(backendDir, 'auth', resourceName, 'build', `${resourceName}-cloudformation-template.json`);
  const cfnTemplate: $TSAny = readJson(cfnTemplatePath, { throwIfNotExist: false });

  if (!cfnTemplate) {
    return undefined;
  }

  return cfnTemplate.Resources.UserPool?.Properties?.UserAttributeUpdateSettings;
};

const addExtraLineToCliInputsJson = async (backendDir: string, resourceName: string): Promise<void> => {
  const cliInputsFile = path.join(backendDir, 'auth', resourceName, 'cli-inputs.json');

  if (fs.existsSync(cliInputsFile)) {
    fs.appendFile(cliInputsFile, ' ');
  }
};
