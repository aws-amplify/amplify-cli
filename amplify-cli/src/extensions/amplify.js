// This is the amplify CLI extension. It gets parked on `context.amplify` and each
// of the functions defined here are available as functions on that.

// bring in each of the constituents


const enableCategory = require('./amplify-helpers/enable-category').enableCategory;
const addResource = require('./amplify-helpers/add-resource').addResource;
const getProjectDetails = require('./amplify-helpers/get-project-details').getProjectDetails;
const copyBatch = require('./amplify-helpers/copy-batch').copyBatch;
const pathManager = require('./amplify-helpers/path-manager');

module.exports = (context) => {
  const amplify = {
    enableCategory,
    addResource,
    getProjectDetails,
    copyBatch,
    pathManager
  };
  
  context.amplify = amplify;
}