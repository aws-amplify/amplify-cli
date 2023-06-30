declare module 'amplify-codegen' {
  export function getCodegenConfig(projectPath: string | undefined): CodegenConfigHelper;

  export type CodegenConfigHelper = {
    getGeneratedTypesPath: () => string | undefined;
    getGeneratedQueriesPath: () => string;
    getGeneratedMutationsPath: () => string;
    getGeneratedSubscriptionsPath: () => string;
    getGeneratedFragmentsPath: () => string;
    getQueryMaxDepth: () => number | undefined;
  };
}
