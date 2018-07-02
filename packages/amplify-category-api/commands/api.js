const featureName = 'api';

module.exports = {
  name: featureName,
  run: async (context) => {
    context.print.info("Here's a list of all the Amplify API commands!");
  },
};
