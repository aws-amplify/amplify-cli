const CODEGEN_OLD_PACKAGE = 'amplify-codegen-appsync-model-plugin';
const CODEGEN_NEW_PACKAGE = '@aws-amplify/appsync-modelgen-plugin';

function getCodegenPackageName(isNewCodegenPackage) {
  const oldCodegen = require(CODEGEN_OLD_PACKAGE);
  const newCodegen = require(CODEGEN_NEW_PACKAGE);
  return isNewCodegenPackage ? newCodegen : oldCodegen;
}

module.exports = {
  getCodegenPackageName,
  CODEGEN_OLD_PACKAGE,
  CODEGEN_NEW_PACKAGE,
};
