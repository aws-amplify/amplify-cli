const CODEGEN_OLD_PACKAGE = 'amplify-codegen-appsync-model-plugin';
const CODEGEN_NEW_PACKAGE = '@aws-amplify/appsync-modelgen-plugin';

function getCodegenPackageName(isNewCodegenPackage) {
  return isNewCodegenPackage ? CODEGEN_NEW_PACKAGE : CODEGEN_OLD_PACKAGE;
}

module.exports = {
  getCodegenPackageName,
  CODEGEN_OLD_PACKAGE,
  CODEGEN_NEW_PACKAGE,
};
