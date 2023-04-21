import { $TSContext, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { importResource } from '../../provider-controllers/import';

export const name = 'import';

export const run = async (context: $TSContext) => {
  try {
    return await importResource(context);
  } catch (error) {
    throw new AmplifyFault(
      'ResourceImportFault',
      {
        message: 'There was an error importing the geofence collection',
      },
      error as Error,
    );
  }
};
