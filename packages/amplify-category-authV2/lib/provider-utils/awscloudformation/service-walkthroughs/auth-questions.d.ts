export function serviceWalkthrough(
  context: any,
  defaultValuesFilename: any,
  stringMapsFilename: any,
  serviceMetadata: any,
  coreAnswers?: {},
): Promise<{
  userPoolGroupList: any;
  adminQueryGroup: any;
  serviceName: string;
}>;
export function userPoolProviders(
  oAuthProviders: any,
  coreAnswers: any,
  prevAnswers: any,
): {
  hostedUIProviderMeta: string;
  hostedUIProviderCreds: string;
} | null;
export function parseOAuthCreds(providers: any, metadata: any, envCreds: any): {};
export function structureOAuthMetadata(coreAnswers: any, context: any, defaults: any, amplify: any): any;
export function getIAMPolicies(
  context: any,
  resourceName: any,
  crudOptions: any,
): {
  policy: {};
  attributes: string[];
};
export function identityPoolProviders(coreAnswers: any, projectType: any): void;
//# sourceMappingURL=auth-questions.d.ts.map
