async function run(context) {
  // print out the help message of your plugin
  context.print.info('amplify hosting serve: Opens your deployed site');
  context.print.info('');
  context.print.info('amplify hosting configure: Set up custom domains, redirects, password protection, and more via the Amplify Console.');
  context.print.info('');
  context.print.info('amplify publish: Publishes changes to manually deployed apps. For continuous deployment, please push to your git branch to deploy updates.');
  context.print.info('');
  context.print.info('amplify hosting remove: Remove hosting from you app.');
}

module.exports = {
  run,
};
