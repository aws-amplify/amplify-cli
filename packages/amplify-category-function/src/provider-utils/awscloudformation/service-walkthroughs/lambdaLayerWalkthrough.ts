import inquirer from 'inquirer';
import { FunctionParameters } from 'amplify-function-plugin-interface';

export async function layerWalkthrough(): Promise<Partial<FunctionParameters>> {
  return await inquirer.prompt(layerPermissions());
}

function layerPermissions(): object[] {
  return [
    {
      type: 'list',
      name: 'layerPermissions',
      message: 'Who should have permission to use this layer?',
      choices: [
        {
          name: 'Only the current AWS account',
          value: 'private',
        },
        {
          name: 'Specific AWS accounts',
          value: 'specific-acc',
        },
        {
          name: 'Specific AWS organization',
          value: 'specific-org',
        },
        {
          name: 'Public (everyone on AWS can use this layer)',
          value: 'public',
        },
      ],
    },
  ];
}
