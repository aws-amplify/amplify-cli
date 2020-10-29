import { UnknownArgumentError, exitOnNextTick } from 'amplify-cli-core';

export const run = async context => {
  if (Array.isArray(context.parameters.array) && context.parameters.array.length > 0) {
    context.print.error('"delete" command does not expect additional arguments.');
    context.print.error('Perhaps you meant to use the "remove" command instead of "delete"?');
    context.usageData.emitError(new UnknownArgumentError());
    exitOnNextTick(1);
  }

  await context.amplify.deleteProject(context);
};
