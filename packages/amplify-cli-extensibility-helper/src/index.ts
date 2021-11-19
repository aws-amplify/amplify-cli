export { AmplifyRootStackTemplate } from './types/project/types';
export { AmplifyAuthCognitoStackTemplate, AmplifyUserPoolGroupStackTemplate } from './types/auth/types';
import { addCDKResourceDependency } from '@aws-amplify/amplify-category-custom';
export { AmplifyDDBResourceTemplate, AmplifyS3ResourceTemplate, AmplifyCDKL1 } from './types/storage/types';
import { getProjectInfo } from './helpers/project-info';
import { AmplifyResourceProps } from '@aws-amplify/amplify-category-custom';
export { AppSyncServiceResourceStack } from './types/api/amplify-api-resource-stack-types';

export { getProjectInfo, addCDKResourceDependency as addResourceDependency, AmplifyResourceProps };
