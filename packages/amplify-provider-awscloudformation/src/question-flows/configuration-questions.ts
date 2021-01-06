import { $TSAny } from 'amplify-cli-core';
import { ListQuestion, ConfirmQuestion, PasswordQuestion } from 'inquirer';
import awsRegions from '../aws-regions';

export function authTypeQuestion(choices: { name: string, value: string }[]): ListQuestion {
  return {
    type: 'list',
    name: 'authChoice',
    message: 'Which authentication method do you want to use?',
    choices,
  };
}

export function profileConfirmQuestion(defaultAns: boolean): ConfirmQuestion {
  return {
    type: 'confirm',
    name: 'useProfile',
    message: 'Do you want to use an AWS profile?',
    default: defaultAns,
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
  transformer: $TSAny,
): (PasswordQuestion | ListQuestion)[] {
  return [
    {
      type: 'password',
      mask: '*',
      name: 'accessKeyId',
      message: 'accessKeyId: ',
      default: accessKeyDefault,
      transformer,
    },
    {
      type: 'password',
      mask: '*',
      name: 'secretAccessKey',
      message: 'secretAccessKey: ',
      default: secretAccessKeyDefault,
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
