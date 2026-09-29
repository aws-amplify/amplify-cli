import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';

/**
 * Execute the 'delete' command
 */
export const run = async (context: $TSContext): Promise<void> => {
  if (Array.isArray(context.parameters.array) && context.parameters.array.length > 0) {
    throw new AmplifyError('CommandNotSupportedError', {
      message: 'The "delete" command does not expect additional arguments.',
      details: 'Perhaps you meant to use the "remove" command instead of "delete"?',
      resolution:
        'If you intend to delete this project and all backend resources, try the "delete" command again without any additional arguments.',
    });
  }

  await context.amplify.deleteProject(context);
};
