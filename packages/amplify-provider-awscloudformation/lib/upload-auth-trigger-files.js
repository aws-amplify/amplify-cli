const { uploadFiles } = require('../../amplify-category-auth/provider-utils/awscloudformation/utils/trigger-file-uploader');

async function uploadAuthTriggerFiles(context, toBeCreated, toBeUpdated) {
  const newAuth = toBeCreated.find(a => a.service === 'Cognito');
  const updatedAuth = toBeUpdated.find(b => b.service === 'Cognito');
  if (newAuth || updatedAuth) {
    await uploadFiles(context);
  } else {
    return null;
  }
}

module.exports = {
  uploadAuthTriggerFiles,
};
