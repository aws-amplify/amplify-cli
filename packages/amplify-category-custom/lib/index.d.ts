import { $TSAny, $TSContext, IAmplifyResource } from '@aws-amplify/amplify-cli-core';
export { generateDependentResourcesType } from './utils/build-custom-resources';
export { addCDKResourceDependency } from './utils/dependency-management-utils';
export { AmplifyResourceProps } from './utils/generate-cfn-from-cdk';
export declare const executeAmplifyCommand: (context: $TSContext) => Promise<void>;
export declare const handleAmplifyEvent: (__context: $TSContext, args: $TSAny) => Promise<void>;
export declare const transformCategoryStack: (context: $TSContext, resource: IAmplifyResource) => Promise<void>;
//# sourceMappingURL=index.d.ts.map