export * from './cliContext';
export * from './cliContextEnvironmentProvider';
export * from './cliEnvironmentProvider';
export * from './feature-flags';
export * from './jsonUtilities';
export * from './jsonValidationError';
export * from './prompts';
export * from './state-manager';

// Temporary types until we can finish full type definition across the whole CLI

// Use it for all 'any's where we can't define the type, but doing a strict TypeScript conversion
export type $TSAny = any;

// Use it for all CLI Context class references, it enables a quick way to see what we have on the context
export type $TSContext = {
  amplify: AmplifyToolkit;
  print: $TSAny;
  migrationInfo: $TSAny;
  prompt: $TSAny;
  exeInfo: $TSAny;
  input: $TSAny;
  parameters: $TSAny;
  usageData: $TSAny;
  runtime: $TSAny;
};

// Use it for all file content read from amplify-meta.json
export type $TSMeta = any;

// Use it for all file content read from team-provider-info.json
export type $TSTeamProviderInfo = any;

// Use it for all object initializer usages: {}
export type $TSObject = Record<string, $TSAny>;

// Temporary interface until Context refactor
interface AmplifyToolkit {
  buildResources: () => $TSAny;
  confirmPrompt: (prompt: string, defaultValue?: boolean) => $TSAny;
  constants: $TSAny;
  constructExeInfo: () => $TSAny;
  copyBatch: () => $TSAny;
  crudFlow: () => $TSAny;
  deleteProject: () => $TSAny;
  executeProviderUtils: () => $TSAny;
  getAllEnvs: () => $TSAny;
  getPlugin: () => $TSAny;
  getCategoryPluginInfo: (context: $TSContext) => $TSAny;
  getAllCategoryPluginInfo: (context: $TSContext) => $TSAny;
  getFrontendPlugins: () => $TSAny;
  getEnvDetails: () => $TSAny;
  getEnvInfo: () => $TSAny;
  getProviderPlugins: () => $TSAny;
  getPluginInstance: () => $TSAny;
  getProjectConfig: () => $TSAny;
  getProjectDetails: () => $TSAny;
  getProjectMeta: () => $TSMeta;
  getResourceStatus: (category?: $TSAny, resourceName?: $TSAny, providerName?: $TSAny, filteredResources?: $TSAny) => $TSAny;
  getResourceOutputs: () => $TSAny;
  getWhen: () => $TSAny;
  inputValidation: () => $TSAny;
  listCategories: () => $TSAny;
  makeId: () => $TSAny;
  openEditor: () => $TSAny;
  onCategoryOutputsChange: (context: $TSContext, amplifyMeta: $TSMeta) => $TSAny;
  pathManager: () => $TSAny;
  pressEnterToContinue: () => $TSAny;
  pushResources: () => $TSAny;
  storeCurrentCloudBackend: () => $TSAny;
  readJsonFile: () => $TSAny;
  removeEnvFromCloud: () => $TSAny;
  removeResource: () => $TSAny;
  sharedQuestions: () => $TSAny;
  showAllHelp: () => $TSAny;
  showHelp: () => $TSAny;
  showHelpfulProviderLinks: () => $TSAny;
  showResourceTable: () => $TSAny;
  serviceSelectionPrompt: () => $TSAny;
  updateProjectConfig: () => $TSAny;
  updateamplifyMetaAfterResourceUpdate: () => $TSAny;
  updateamplifyMetaAfterResourceAdd: () => $TSAny;
  updateamplifyMetaAfterResourceDelete: () => $TSAny;
  updateProvideramplifyMeta: () => $TSAny;
  updateamplifyMetaAfterPush: () => $TSAny;
  updateamplifyMetaAfterBuild: () => $TSAny;
  updateAmplifyMetaAfterPackage: () => $TSAny;
  updateBackendConfigAfterResourceAdd: () => $TSAny;
  updateBackendConfigAfterResourceUpdate: () => $TSAny;
  updateBackendConfigAfterResourceRemove: () => $TSAny;
  loadEnvResourceParameters: () => $TSAny;
  saveEnvResourceParameters: () => $TSAny;
  removeResourceParameters: () => $TSAny;
  triggerFlow: () => $TSAny;
  addTrigger: () => $TSAny;
  updateTrigger: () => $TSAny;
  deleteTrigger: () => $TSAny;
  deleteAllTriggers: () => $TSAny;
  deleteDeselectedTriggers: () => $TSAny;
  dependsOnBlock: () => $TSAny;
  getTriggerMetadata: () => $TSAny;
  getTriggerPermissions: () => $TSAny;
  getTriggerEnvVariables: () => $TSAny;
  getTriggerEnvInputs: () => $TSAny;
  getUserPoolGroupList: () => $TSAny;
  forceRemoveResource: () => $TSAny;
  writeObjectAsJson: () => $TSAny;
  hashDir: () => $TSAny;
  leaveBreadcrumbs: () => $TSAny;
  readBreadcrumbs: () => $TSAny;
  loadRuntimePlugin: () => $TSAny;
}
