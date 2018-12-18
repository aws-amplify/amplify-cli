const fs = require('fs-extra');
const constants = require('./constants');

module.exports = (context) => {
  const categoryMeta = context.exeInfo.amplifyMeta[constants.CategoryName];
  if (categoryMeta) {
    writeAmplifyMeta(categoryMeta, context.amplify.pathManager.getAmplifyMetaFilePath());
    writeAmplifyMeta(categoryMeta, context.amplify.pathManager.getCurentAmplifyMetaFilePath());
    context.amplify.onCategoryOutputsChange(context);
  }
};

function writeAmplifyMeta(categoryMeta, amplifyMetaFilePath) {
  if (fs.existsSync(amplifyMetaFilePath)) {
    const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));
    amplifyMeta[constants.CategoryName] = categoryMeta;
    const jsonString = JSON.stringify(amplifyMeta, null, '\t');
    fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
  }
}
