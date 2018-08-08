const subcommand = 'remove';
const category = 'auth';
const fs = require('fs');

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    const existingAuth = Object.keys(amplify.getProjectDetails().amplifyMeta.auth);

    if (existingAuth) {
      const currentAuthParams = JSON.parse(fs.readFileSync(`${amplify.pathManager.getBackendDirPath()}/auth/${existingAuth[0]}/parameters.json`));
      // const currentConstraints = JSON.parse(currentAuthParams.savedConstraints);

      if (currentAuthParams.savedConstraints) {
        context.print.error('\nWarning: The some of your resources depend on this Auth resource.  Delete at your own risk.\n');
      }
      // const { table } = context.print;
      // const tableOptions = [['Category', 'Resource Name']];

      // currentConstraints.forEach((s) => {
      //   const category = Object.keys(s)[0];
      //   const row = [
      //     category,
      //     Object.keys(s[category])[0]
      //   ];
      //   tableOptions.push(row);
      // });
      // table(
      //   tableOptions,
      //   { format: 'markdown' },
      // );
    }

    return amplify.removeResource(context, category, resourceName)
      .then(() => {
        context.print.success('Successfully removed resource');
      })
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('There was an error removing the auth resource');
      });
  },
};
