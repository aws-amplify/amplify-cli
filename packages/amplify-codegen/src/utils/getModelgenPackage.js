const oldModelgen = require('amplify-codegen-appsync-model-plugin'); // old modelgen package
const newModelgen = require('@aws-amplify/appsync-modelgen-plugin'); // migrated modelgen package

function getModelgenPackage(isNewModelgenPackage) {
  return isNewModelgenPackage ? newModelgen : oldModelgen;
}

module.exports = {
  getModelgenPackage,
};
