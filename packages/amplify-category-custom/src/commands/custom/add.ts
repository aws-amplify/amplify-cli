import { customDeploymentOptionsQuestion } from '../../utils/common-questions';
import { addCDKWalkthrough } from '../../walkthroughs/cdk-walkthrough';
import { addCloudFormationWalkthrough } from '../../walkthroughs/cloudformation-walkthrough';
import { $TSContext } from 'amplify-cli-core';

export const name = 'add';

export async function run(context: $TSContext) {
  const deploymentOption = await customDeploymentOptionsQuestion();

  if (deploymentOption === 'AWS CDK') {
    await addCDKWalkthrough(context);
  } else if (deploymentOption === 'AWS CloudFormation') {
    await addCloudFormationWalkthrough(context);
  }
}
