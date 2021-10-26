import { $TSContext, ExportedStackNotFoundError, ExportedStackNotInValidStateError } from 'amplify-cli-core';
import Cloudformation from './aws-utils/aws-cfn';
import { printer } from 'amplify-prompts';
import * as _ from 'lodash';

export async function run(context: $TSContext, stackName: string) {
  const cfn = await new Cloudformation(context);
  let rootStack = null;
  let nextToken = null;
  let continueListing = false;
  do {
    const stacks = await cfn.listStacks(nextToken, []);
    rootStack = _.find(stacks.StackSummaries, summary => summary.StackName === stackName);
    // if stack found the
    if (rootStack) {
      continueListing = false;
      continue;
    }

    // if reached the end then stop listing
    if (!stacks.NextToken) {
      continueListing = false;
      continue;
    }

    // if the stack is not found keep looking
    if (stacks.NextToken) {
      nextToken = stacks.NextToken;
      continueListing = true;
      continue;
    }
  } while (continueListing);

  // if stack isn't found mostly because the stack isn't accessible by the credentials
  if (!rootStack) {
    printer.error(`${stackName} could not be found, are you sure you are using the right credentials?`);
    throw new ExportedStackNotFoundError(`${stackName} not found`);
  }

  // if the stack is found and is not in valid state
  if (rootStack.StackStatus !== 'UPDATE_COMPLETE' && rootStack.StackStatus !== 'CREATE_COMPLETE') {
    throw new ExportedStackNotInValidStateError(`${stackName} not in UPDATE_COMPLETE or CREATE_COMPLETE state`);
  }

  await cfn.updateamplifyMetaFileWithStackOutputs(stackName);
}
