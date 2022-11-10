import * as path from 'path';
import {
  $TSAny,
  $TSMeta,
  JSONUtilities,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';

const {
  readJson,
} = JSONUtilities;

/**
 * Displays messages to users when CLI makes updates for them in their build directories and is not detected by version control
 * or 'amplify status'
 */
export const showBuildDirChangesMessage = async (): Promise<void> => {
  const currentCloudBackendDir = pathManager.getCurrentCloudBackendDirPath();
  const localBackendDir = pathManager.getBackendDirPath();
  const amplifyMeta = stateManager.getMeta();

  await showCognitoAttributesRequireVerificationBeforeUpdateMessage(currentCloudBackendDir, localBackendDir, amplifyMeta);
};

const showCognitoAttributesRequireVerificationBeforeUpdateMessage = async (
  currentCloudBackendDir: string,
  localBackendDir: string,
  amplifyMeta: $TSMeta,
): Promise<void> => {
  const cognitoResource = stateManager.getResourceFromMeta(amplifyMeta, 'auth', 'Cognito', undefined, false);

  if (!cognitoResource) {
    return;
  }

  const { resourceName } = cognitoResource;
  const authAlreadyPushed = fs.existsSync(path.join(currentCloudBackendDir, 'auth', resourceName));
  const cloudBackendUserAttrUpdateSettings = await readCfnTemplateUserAttributeSettings(currentCloudBackendDir, resourceName);
  const backendUserAttrUpdateSettings = await readCfnTemplateUserAttributeSettings(localBackendDir, resourceName);
  const updateNotInCloudBackend: boolean = !cloudBackendUserAttrUpdateSettings?.AttributesRequireVerificationBeforeUpdate
    || cloudBackendUserAttrUpdateSettings?.AttributesRequireVerificationBeforeUpdate[0] !== 'email';
  const updateInLocalBackend: boolean = backendUserAttrUpdateSettings?.AttributesRequireVerificationBeforeUpdate.length === 1
    && backendUserAttrUpdateSettings?.AttributesRequireVerificationBeforeUpdate[0] === 'email';

  if (authAlreadyPushed && updateNotInCloudBackend && updateInLocalBackend) {
    printer.warn(
      `Amplify CLI now supports verifying a Cognito user email address that has been changed and will automatically update your auth \
configuration. Read more: https://docs.amplify.aws/lib/auth/manageusers/q/platform/js/#updating-and-verifying-a-cognito-user-email-address`,
    );
  }
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
