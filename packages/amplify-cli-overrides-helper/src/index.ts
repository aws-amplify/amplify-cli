//import { AmplifyRootStackTemplate } from 'amplify-provider-awscloudformation';
import { AmplifyAuthCognitoStackTemplate } from '@aws-amplify/amplify-category-auth';
import { addCDKResourceDependency } from '@aws-amplify/amplify-category-custom';
import { AmplifyDDBResourceTemplate, AmplifyS3ResourceTemplate } from '@aws-amplify/amplify-category-storage';
import { getProjectInfo } from './helpers/project-info';
import { AppSyncServiceResourceStack } from '@aws-amplify/graphql-transformer-core';
import { AmplifyApigwResourceTemplate } from '@aws-amplify/amplify-category-api';

export {
  getProjectInfo,
  //AmplifyRootStackTemplate,
  AmplifyAuthCognitoStackTemplate,
  AmplifyDDBResourceTemplate,
  AmplifyS3ResourceTemplate,
  addCDKResourceDependency,
  AppSyncServiceResourceStack,
  AmplifyApigwResourceTemplate,
};
