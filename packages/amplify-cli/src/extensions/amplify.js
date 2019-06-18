// This is the amplify CLI extension. It gets parked on `context.amplify` and each
// of the functions defined here are available as functions on that.

// bring in each of the constituents

const constants = require('./amplify-helpers/constants');
const confirmPrompt = require('./amplify-helpers/confirm-prompt');
const pressEnterToContinue = require('./amplify-helpers/press-enter-to-continue');
const { constructExeInfo } = require('./amplify-helpers/construct-exeInfo');
const { removeResource, forceRemoveResource } = require('./amplify-helpers/remove-resource');
const { pushResources } = require('./amplify-helpers/push-resources');
const { deleteProject } = require('./amplify-helpers/delete-project');
const { removeEnvFromCloud } = require('./amplify-helpers/remove-env-from-cloud');
const { buildResources } = require('./amplify-helpers/build-resources');
const { getPlugin } = require('./amplify-helpers/get-plugin');
const { getCategoryPlugins } = require('./amplify-helpers/get-category-plugins');
const { getFrontendPlugins } = require('./amplify-helpers/get-frontend-plugins');
const { getProviderPlugins } = require('./amplify-helpers/get-provider-plugins');
const { getProjectConfig } = require('./amplify-helpers/get-project-config');
const { getEnvInfo } = require('./amplify-helpers/get-env-info');
const { getEnvDetails } = require('./amplify-helpers/get-env-details');
const { getAllEnvs } = require('./amplify-helpers/get-all-envs');
const { getProjectDetails } = require('./amplify-helpers/get-project-details');
const { getProjectMeta } = require('./amplify-helpers/get-project-meta');
const { getResourceStatus } = require('./amplify-helpers/resource-status');
const { getResourceOutputs } = require('./amplify-helpers/get-resource-outputs');
const { showResourceTable } = require('./amplify-helpers/resource-status');
const { sharedQuestions } = require('./amplify-helpers/shared-questions.js');
const { inputValidation } = require('./amplify-helpers/input-validation');
const { copyBatch } = require('./amplify-helpers/copy-batch');
const { listCategories } = require('./amplify-helpers/list-categories');
const { readJsonFile } = require('./amplify-helpers/read-json-file');
const pathManager = require('./amplify-helpers/path-manager');
const { makeId } = require('./amplify-helpers/make-id');
const { openEditor } = require('./amplify-helpers/open-editor');
const { getWhen } = require('./amplify-helpers/get-when-function');
const { serviceSelectionPrompt } = require('./amplify-helpers/service-select-prompt');
const { updateProjectConfig } = require('./amplify-helpers/update-project-config');
const { isRunningOnEC2 } = require('./amplify-helpers/is-running-on-EC2');
const { onCategoryOutputsChange } = require('./amplify-helpers/on-category-outputs-change');
const { getPluginInstance } = require('./amplify-helpers/get-plugin-instance');
const {
  triggerFlow,
  addTrigger,
  updateTrigger,
  deleteTrigger,
  deleteAllTriggers,
  deleteDeselectedTriggers,
  dependsOnBlock,
  getTriggerMetadata,
  getTriggerPermissions,
  getTriggerEnvVariables,
  getTriggerEnvInputs,
} = require('./amplify-helpers/trigger-flow');
const {
  updateProvideramplifyMeta,
  updateamplifyMetaAfterPush,
  updateamplifyMetaAfterBuild,
  updateAmplifyMetaAfterPackage,
  updateamplifyMetaAfterResourceAdd,
  updateamplifyMetaAfterResourceUpdate,
  updateamplifyMetaAfterResourceDelete,
} = require('./amplify-helpers/update-amplify-meta');
const {
  updateBackendConfigAfterResourceAdd,
  updateBackendConfigAfterResourceRemove,
} = require('./amplify-helpers/update-backend-config');
const { showHelp } = require('./amplify-helpers/show-help');
const { executeProviderUtils } = require('./amplify-helpers/execute-provider-utils');
const { showHelpfulProviderLinks } = require('./amplify-helpers/show-helpful-provider-links');
const { crudFlow } = require('./amplify-helpers/permission-flow');

const {
  loadEnvResourceParameters,
  saveEnvResourceParameters,
  removeResourceParameters,
} = require('./amplify-helpers/envResourceParams');

module.exports = (context) => {
  const amplify = {
    buildResources,
    confirmPrompt,
    constants,
    constructExeInfo,
    copyBatch,
    crudFlow,
    deleteProject,
    executeProviderUtils,
    forceRemoveResource,
    getAllEnvs,
    getPlugin,
    getCategoryPlugins,
    getFrontendPlugins,
    getEnvDetails,
    getEnvInfo,
    getProviderPlugins,
    getPluginInstance,
    getProjectConfig,
    getProjectDetails,
    getProjectMeta,
    getResourceStatus,
    getResourceOutputs,
    getWhen,
    inputValidation,
    isRunningOnEC2,
    listCategories,
    makeId,
    openEditor,
    onCategoryOutputsChange,
    pathManager,
    pressEnterToContinue,
    pushResources,
    readJsonFile,
    removeEnvFromCloud,
    removeResource,
    sharedQuestions,
    showHelp,
    showHelpfulProviderLinks,
    showResourceTable,
    serviceSelectionPrompt,
    updateProjectConfig,
    updateamplifyMetaAfterResourceUpdate,
    updateamplifyMetaAfterResourceAdd,
    updateamplifyMetaAfterResourceDelete,
    updateProvideramplifyMeta,
    updateamplifyMetaAfterPush,
    updateamplifyMetaAfterBuild,
    updateAmplifyMetaAfterPackage,
    updateBackendConfigAfterResourceAdd,
    updateBackendConfigAfterResourceRemove,
    loadEnvResourceParameters,
    saveEnvResourceParameters,
    removeResourceParameters,
    triggerFlow,
    addTrigger,
    updateTrigger,
    deleteTrigger,
    deleteAllTriggers,
    deleteDeselectedTriggers,
    dependsOnBlock,
    getTriggerMetadata,
    getTriggerPermissions,
    getTriggerEnvVariables,
    getTriggerEnvInputs,
  };

  context.amplify = amplify;
};
