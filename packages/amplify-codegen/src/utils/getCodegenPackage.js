const oldCodegen = require('amplify-codegen-appsync-model-plugin'); // old codegen package
const newCodegen = require('@aws-amplify/appsync-modelgen-plugin'); // migrated codegen package

function getCodegenPackage(isNewCodegenPackage) {
  return isNewCodegenPackage ? newCodegen : oldCodegen;
}

module.exports = {
  getCodegenPackage,
};
