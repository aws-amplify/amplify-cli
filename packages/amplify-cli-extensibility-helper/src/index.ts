import { addCDKResourceDependency, AmplifyResourceProps } from '@aws-amplify/amplify-category-custom';
import { getProjectInfo } from './helpers/project-info';
export { AppSyncServiceResourceStack } from './types/api/amplify-api-resource-stack-types';
export { AmplifyApigwResourceTemplate } from './types/api/types';
export { AmplifyAuthCognitoStackTemplate, AmplifyUserPoolGroupStackTemplate } from './types/auth/types';
export { AmplifyRootStackTemplate } from './types/project/types';
export { AmplifyCDKL1, AmplifyDDBResourceTemplate, AmplifyS3ResourceTemplate } from './types/storage/types';
export { getProjectInfo, addCDKResourceDependency as addResourceDependency, AmplifyResourceProps };
