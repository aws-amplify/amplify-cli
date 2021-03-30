import { $TSAny } from 'amplify-cli-core';
import { ListQuestion, ConfirmQuestion, PasswordQuestion } from 'inquirer';
import awsRegions from '../aws-regions';

export function authTypeQuestion(choices: { name: string; value: string }[]): ListQuestion {
  return {
    type: 'list',
    name: 'authChoice',
    message: 'Select the authentication method you want to use:',
    choices,
  };
}

export function profileNameQuestion(profiles: string[], defaultProfile: string): ListQuestion {
  return {
    type: 'list',
    name: 'profileName',
    message: 'Please choose the profile you want to use',
    choices: profiles,
    default: defaultProfile,
  };
}

export function accessKeysQuestion(
  accessKeyDefault: $TSAny,
  secretAccessKeyDefault: $TSAny,
  defaultRegion: string,
  accessKeyValidator: $TSAny,
  secretAccessKeyValidator: $TSAny,
  transformer: $TSAny,
): (PasswordQuestion | ListQuestion)[] {
  return [
    {
      type: 'password',
      mask: '*',
      name: 'accessKeyId',
      message: 'accessKeyId: ',
      default: accessKeyDefault,
      validate: accessKeyValidator,
      transformer,
    },
    {
      type: 'password',
      mask: '*',
      name: 'secretAccessKey',
      message: 'secretAccessKey: ',
      default: secretAccessKeyDefault,
      validate: secretAccessKeyValidator,
      transformer,
    },
    {
      type: 'list',
      name: 'region',
      message: 'region: ',
      choices: awsRegions.regions,
      default: defaultRegion,
    },
  ];
}

export const createConfirmQuestion: ConfirmQuestion = {
  type: 'confirm',
  name: 'setProjectLevelConfig',
  message: 'Do you want to set the project level configuration',
  default: true,
};

export const removeProjectComfirmQuestion: ConfirmQuestion = {
  type: 'confirm',
  name: 'removeProjectConfig',
  message: 'Remove project level configuration',
  default: false,
};

export const updateOrRemoveQuestion: ListQuestion = {
  type: 'list',
  name: 'action',
  message: 'Do you want to update or remove the project level AWS profile?',
  choices: [
    { name: 'No', value: 'cancel' },
    { name: 'Update AWS Profile', value: 'update' },
    { name: 'Remove AWS Profile', value: 'remove' },
  ],
  default: 'cancel',
};

export const retryAuthConfig: ConfirmQuestion = {
  type: 'confirm',
  name: 'retryConfirmation',
  message: 'Do you want to retry configuration?',
  default: false,
};
