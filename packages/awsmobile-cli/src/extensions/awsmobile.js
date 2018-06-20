// This is the awsmobile CLI extension. It gets parked on `context.awsmobile` and each
// of the functions defined here are available as functions on that.

// bring in each of the constituents

const constants = require('./awsmobile-helpers/constants');
const pressEnterToContinue = require('./awsmobile-helpers/press-enter-to-continue');
const { removeResource } = require('./awsmobile-helpers/remove-resource');
const { pushResources } = require('./awsmobile-helpers/push-resources');
const { getProjectDetails } = require('./awsmobile-helpers/get-project-details');
const { getResourceStatus } = require('./awsmobile-helpers/resource-status');
const { showResourceTable } = require('./awsmobile-helpers/resource-status');
const { inputValidation } = require('../../../awsmobile-cli/src/extensions/awsmobile-helpers/input-validation');
const { copyBatch } = require('./awsmobile-helpers/copy-batch');
const pathManager = require('./awsmobile-helpers/path-manager');
const nameManager = require('./awsmobile-helpers/name-manager');
const { getWhen } = require('../../../awsmobile-cli/src/extensions/awsmobile-helpers/get-when-function');
const { serviceSelectionPrompt } = require('./awsmobile-helpers/service-select-prompt');
const {
  updateProviderAwsMobileMeta,
  updateAwsMobileMetaAfterPush,
  updateAwsMobileMetaAfterResourceAdd,
  updateAwsMobileMetaAfterResourceUpdate,
  updateAwsMobileMetaAfterResourceDelete,
} = require('./awsmobile-helpers/update-awsmobile-meta');

module.exports = (context) => {
  const awsmobile = {
    constants,
    copyBatch,
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
    updateAwsMobileMetaAfterResourceUpdate,
    updateAwsMobileMetaAfterResourceAdd,
    updateAwsMobileMetaAfterResourceDelete,
    updateProviderAwsMobileMeta,
    updateAwsMobileMetaAfterPush,
  };

  context.awsmobile = awsmobile;
};
