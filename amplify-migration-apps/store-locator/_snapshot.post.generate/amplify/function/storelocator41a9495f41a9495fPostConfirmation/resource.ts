import { defineFunction } from '@aws-amplify/backend';
import { aws_iam } from 'aws-cdk-lib';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const storelocator41a9495f41a9495fPostConfirmation = defineFunction({
  entry: './index.js',
  name: `storelocator41a9495f41a9495fPostConfirmation-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    ENV: `${branchName}`,
    MODULES: 'add-to-group',
    REGION: 'us-east-1',
    GROUP: 'storeLocatorAdmin',
  },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.storelocator41a9495f41a9495fPostConfirmation.resources.cfnResources.cfnFunction.functionName = `storelocator41a9495f41a9495fPostConfirmation-${branchName}`;
  backend.storelocator41a9495f41a9495fPostConfirmation.resources.lambda.addToRolePolicy(
    new aws_iam.PolicyStatement({
      actions: ['cognito-idp:GetGroup', 'cognito-idp:CreateGroup'],
      resources: [backend.auth.resources.userPool.userPoolArn],
    })
  );
}
