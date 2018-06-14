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
const { copyBatch } = require('./awsmobile-helpers/copy-batch');
const pathManager = require('./awsmobile-helpers/path-manager');
// const nameManager = require('./awsmobile-helpers/name-manager');
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
    pressEnterToContinue,
    removeResource,
    pushResources,
    getProjectDetails,
    getResourceStatus,
    copyBatch,
    pathManager,
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
