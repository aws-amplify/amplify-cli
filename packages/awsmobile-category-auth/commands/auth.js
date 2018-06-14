const featureName = 'auth';

module.exports = {
  name: featureName,
  run: async (context) => {
    const { print } = context;
    print.info("Here's a list of all the Amplify Auth commands!");
  },
};
