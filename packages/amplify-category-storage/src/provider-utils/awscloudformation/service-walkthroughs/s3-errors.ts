import { ResourceDoesNotExistError, ResourceAlreadyExistsError, $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';

export async function printErrorNoResourcesToUpdate( context : $TSContext ){
    const errMessage = 'No resources to update. You need to add a resource.';
    printer.error(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
  }

export async function printErrorAlreadyCreated( context : $TSContext ){
    const errMessage = 'Amazon S3 storage was already added to your project.';
    printer.warn(errMessage);
    await context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));
}
