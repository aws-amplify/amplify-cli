const subcommand = 'push';
const category = 'auth';
const { uploadFiles } = require('../../provider-utils/awscloudformation/utils/trigger-file-uploader');

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;
    context.amplify.constructExeInfo(context);
    return amplify.pushResources(context, category, resourceName)
      .then(async () => {
        await uploadFiles(context);
      })
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error pushing the auth resource');
      });
  },
};
