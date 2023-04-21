/* eslint-disable no-continue */
import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import * as _ from 'lodash';
import Cloudformation from './aws-utils/aws-cfn';

/**
 * entry point for the export update amplify meta
 */
export const run = async (context: $TSContext, stackName: string): Promise<void> => {
  const cfn = await new Cloudformation(context);
  let rootStack = null;
  let nextToken = null;
  let continueListing = false;
  do {
    const stacks = await cfn.listStacks(nextToken, []);
    rootStack = _.find(stacks.StackSummaries, (summary) => summary.StackName === stackName);
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
    throw new AmplifyError('StackNotFoundError', {
      message: `${stackName} could not be found.`,
      resolution: 'Please check the stack name and credentials.',
    });
  }

  // if the stack is found and is not in valid state
  if (rootStack.StackStatus !== 'UPDATE_COMPLETE' && rootStack.StackStatus !== 'CREATE_COMPLETE') {
    throw new AmplifyError('StackNotFoundError', {
      message: `${stackName} not in UPDATE_COMPLETE or CREATE_COMPLETE state`,
    });
  }

  await cfn.updateamplifyMetaFileWithStackOutputs(stackName);
};
