import { AmplifyProjectInfo, AmplifyRootStackTemplate } from '@aws-amplify/cli-extensibility-helper';

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
export function override(props: AmplifyRootStackTemplate, amplifyProjectInfo: AmplifyProjectInfo): void {
  props.authRole!.roleName = `mockRole-${getRandomInt(10000)}`;
  const apiGatewayPolicy = {
    policyName: 'ApiGatewayPolicy',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: 'execute-api:*',
          Resource: '*',
        },
      ],
    },
  };
  const rekognitionPolicy = {
    policyName: 'RekognitionPolicy',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: '*',
          Resource: '*',
        },
      ],
    },
  };

  props.authRole!.policies = [apiGatewayPolicy, rekognitionPolicy];

  if (!amplifyProjectInfo || !amplifyProjectInfo.envName || !amplifyProjectInfo.projectName) {
    throw new Error(`Project info is missing in override: ${JSON.stringify(amplifyProjectInfo)}`);
  }

  if (amplifyProjectInfo.envName != '##EXPECTED_ENV_NAME') {
    throw new Error(`Unexpected envName: ${amplifyProjectInfo.envName}`);
  }

  if (amplifyProjectInfo.projectName != '##EXPECTED_PROJECT_NAME') {
    throw new Error(`Unexpected envName: ${amplifyProjectInfo.envName}`);
  }
}
