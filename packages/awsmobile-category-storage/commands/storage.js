const featureName = 'storage';

module.exports = {
  name: featureName,
  run: async (context) => {
    context.print.info("Here's a list of all the Amplify storage commands!");
  },
};
