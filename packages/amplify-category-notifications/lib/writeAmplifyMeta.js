const fs = require('fs-extra');
const constants = require('./constants');

module.exports = (context) => {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  let jsonString = JSON.stringify(context.exeInfo.amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

  const currentAmplifyMetaFilePath = context.amplify.pathManager.getCurentAmplifyMetaFilePath();
  const currentAmplifyMeta = JSON.parse(fs.readFileSync(currentAmplifyMetaFilePath));
  currentAmplifyMeta[constants.CategoryName] = context.exeInfo.amplifyMeta[constants.CategoryName];
  jsonString = JSON.stringify(currentAmplifyMeta, null, '\t');
  fs.writeFileSync(currentAmplifyMetaFilePath, jsonString, 'utf8');

  context.amplify.onCategoryOutputsChange(context);
};

