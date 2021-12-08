import { addCDKResourceDependency, AmplifyResourceProps } from '@aws-amplify/amplify-category-custom';
import { getProjectInfo } from './helpers/project-info';
export { AmplifyApiGraphQlResourceStackTemplate } from './types/api/amplify-api-resource-stack-types';
export { AmplifyApiRestResourceStackTemplate, ApigwPathPolicy } from './types/api/types';
export { AmplifyAuthCognitoStackTemplate, AmplifyUserPoolGroupStackTemplate } from './types/auth/types';
export { AmplifyRootStackTemplate } from './types/project/types';
export { AmplifyCDKL1, AmplifyDDBResourceTemplate, AmplifyS3ResourceTemplate } from './types/storage/types';
export { getProjectInfo, addCDKResourceDependency as addResourceDependency, AmplifyResourceProps };
