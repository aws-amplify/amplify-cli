import { $TSContext } from '.';

export async function promptConfirmationRemove(context: $TSContext, serviceType?: string): Promise<boolean> {
  let promptText =
    'Are you sure you want to delete the resource? This action deletes all files related to this resource from the backend directory.';

  // For imported resources we have to show a different message to ensure customers that resource
  // will NOT be deleted in the cloud.
  if (serviceType === 'imported') {
    promptText =
      'Are you sure you want to unlink this imported resource from this Amplify backend environment? The imported resource itself will not be deleted.';
  }

  const confirm = context.input.options?.yes || (await context.amplify.confirmPrompt(promptText));
  return confirm;
}
