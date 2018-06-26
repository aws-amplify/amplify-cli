// This is the amplify CLI extension. It gets parked on `context.amplify` and each
// of the functions defined here are available as functions on that.

// bring in each of the constituents

const constants = require('./amplify-helpers/constants');
const pressEnterToContinue = require('./amplify-helpers/press-enter-to-continue');
const { removeResource } = require('./amplify-helpers/remove-resource');
const { pushResources } = require('./amplify-helpers/push-resources');
const { getProjectConfig } = require('./amplify-helpers/get-project-config');
const { getProjectDetails } = require('./amplify-helpers/get-project-details');
const { getResourceStatus } = require('./amplify-helpers/resource-status');
const { showResourceTable } = require('./amplify-helpers/resource-status');
const { inputValidation } = require('../../../amplify-cli/src/extensions/amplify-helpers/input-validation');
const { copyBatch } = require('./amplify-helpers/copy-batch');
const pathManager = require('./amplify-helpers/path-manager');
const nameManager = require('./amplify-helpers/name-manager');
const { getWhen } = require('../../../amplify-cli/src/extensions/amplify-helpers/get-when-function');
const { serviceSelectionPrompt } = require('./amplify-helpers/service-select-prompt');
const {
  updateProvideramplifyMeta,
  updateamplifyMetaAfterPush,
  updateamplifyMetaAfterResourceAdd,
  updateamplifyMetaAfterResourceUpdate,
  updateamplifyMetaAfterResourceDelete,
} = require('./amplify-helpers/update-amplify-meta');

module.exports = (context) => {
  const amplify = {
    constants,
    copyBatch,
    getProjectConfig,
    getProjectDetails,
    getResourceStatus,
    getWhen,
    inputValidation,
    pathManager,
    nameManager,
    pressEnterToContinue,
    pushResources,
    removeResource,
    showResourceTable,
    serviceSelectionPrompt,
    updateamplifyMetaAfterResourceUpdate,
    updateamplifyMetaAfterResourceAdd,
    updateamplifyMetaAfterResourceDelete,
    updateProvideramplifyMeta,
    updateamplifyMetaAfterPush,
  };

  context.amplify = amplify;
};
