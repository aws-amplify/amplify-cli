// This is the amplify CLI extension. It gets parked on `context.amplify` and each
// of the functions defined here are available as functions on that.

// bring in each of the constituents

const constants = require('./amplify-helpers/constants');
const pressEnterToContinue = require('./amplify-helpers/press-enter-to-continue');
const { removeResource } = require('./amplify-helpers/remove-resource');
const { pushResources } = require('./amplify-helpers/push-resources');
const { buildResources } = require('./amplify-helpers/build-resources');
const { getProjectConfig } = require('./amplify-helpers/get-project-config');
const { getProjectDetails } = require('./amplify-helpers/get-project-details');
const { getProjectMeta } = require('./amplify-helpers/get-project-meta'); 
const { getResourceStatus } = require('./amplify-helpers/resource-status');
const { getResourceOutputs } = require('./amplify-helpers/get-resource-outputs');
const { showResourceTable } = require('./amplify-helpers/resource-status');
const { sharedQuestions } = require('./amplify-helpers/shared-questions.js');
const { inputValidation } = require('../../../amplify-cli/src/extensions/amplify-helpers/input-validation');
const { copyBatch } = require('./amplify-helpers/copy-batch');
const { listCategories } = require('./amplify-helpers/list-categories');
const pathManager = require('./amplify-helpers/path-manager');
const { makeId } = require('./amplify-helpers/make-id');
const { getWhen } = require('../../../amplify-cli/src/extensions/amplify-helpers/get-when-function');
const { serviceSelectionPrompt } = require('./amplify-helpers/service-select-prompt');
const { updateProjectConfig } = require('./amplify-helpers/update-project-config');
const { isRunningOnEC2 } = require('./amplify-helpers/is-running-on-EC2');
const {
  updateProvideramplifyMeta,
  updateamplifyMetaAfterPush,
  updateamplifyMetaAfterBuild,
  updateAmplifyMetaAfterPackage,
  updateamplifyMetaAfterResourceAdd,
  updateamplifyMetaAfterResourceUpdate,
  updateamplifyMetaAfterResourceDelete,
} = require('./amplify-helpers/update-amplify-meta');
const { showHelp } = require('./amplify-helpers/show-help');
const { executeProviderUtils } = require('./amplify-helpers/execute-provider-utils');

module.exports = (context) => {
  const amplify = {
    buildResources,
    constants,
    copyBatch,
    executeProviderUtils,
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
    pathManager,
    pressEnterToContinue,
    pushResources,
    removeResource,
    sharedQuestions,
    showHelp,
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
  };

  context.amplify = amplify;
};
