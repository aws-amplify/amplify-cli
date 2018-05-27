// This is the awsmobile CLI extension. It gets parked on `context.awsmobile` and each
// of the functions defined here are available as functions on that.

// bring in each of the constituents

const addResource = require('./awsmobile-helpers/add-resource').addResource;
const getProjectDetails = require('./awsmobile-helpers/get-project-details').getProjectDetails;
const copyBatch = require('./awsmobile-helpers/copy-batch').copyBatch;
const pathManager = require('./awsmobile-helpers/path-manager');

module.exports = (context) => {
  const awsmobile = {
    addResource,
    getProjectDetails,
    copyBatch,
    pathManager
  };
  
  context.awsmobile = awsmobile;
}