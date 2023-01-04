import { printer } from 'amplify-prompts';
import { detectCognitoAttributesRequireVerificationBeforeUpdateDiff } from './update-tracked-files';

/**
 * Displays messages to users when CLI makes updates for them in their build directories and is not detected by version control
 * or 'amplify status'
 */
export const showBuildDirChangesMessage = async (): Promise<void> => {
  if (await detectCognitoAttributesRequireVerificationBeforeUpdateDiff()) {
    printer.warn(
      `Amplify CLI now supports verifying a Cognito user email address that has been changed and will automatically update your auth \
configuration. Read more: https://docs.amplify.aws/lib/auth/manageusers/q/platform/js/#updating-and-verifying-a-cognito-user-email-address`,
    );
  }
};
