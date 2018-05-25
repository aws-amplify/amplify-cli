const featureName = 'storage'

module.exports = {
  name: featureName,
  run: async (context) => {
    const { print, parameters} = context;
    console.log("Here's a list of all the Amplify storage commands!");
  }
}
