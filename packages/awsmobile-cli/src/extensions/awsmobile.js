// This is the awsmobile CLI extension. It gets parked on `context.awsmobile` and each
// of the functions defined here are available as functions on that.

// bring in each of the constituents

const constants = require('./awsmobile-helpers/constants');
const pressEnterToContinue = require('./awsmobile-helpers/press-enter-to-continue')
const removeResource = require('./awsmobile-helpers/remove-resource').removeResource;
const pushResources = require('./awsmobile-helpers/push-resources').pushResources;
const getProjectDetails = require('./awsmobile-helpers/get-project-details').getProjectDetails;
const getResourceStatus = require('./awsmobile-helpers/get-resource-status').getResourceStatus;
const copyBatch = require('./awsmobile-helpers/copy-batch').copyBatch;
const pathManager = require('./awsmobile-helpers/path-manager');
const nameManager = require('./awsmobile-helpers/name-manager'); 
const updateProjectConfig = require('./awsmobile-helpers/update-project-config').updateProjectConfig;
const updateAwsMobileMetaAfterResourceAdd = require('./awsmobile-helpers/update-awsmobile-meta').updateAwsMobileMetaAfterResourceAdd ;
const updateAwsMobileMetaAfterResourceUpdate = require('./awsmobile-helpers/update-awsmobile-meta').updateAwsMobileMetaAfterResourceUpdate;
const updateAwsMobileMetaAfterResourceDelete = require('./awsmobile-helpers/update-awsmobile-meta').updateAwsMobileMetaAfterResourceDelete;

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
    updateAwsMobileMetaAfterResourceUpdate,
    updateAwsMobileMetaAfterResourceAdd,
    updateAwsMobileMetaAfterResourceDelete,
    updateProjectConfig
  };
  
  context.awsmobile = awsmobile;
}