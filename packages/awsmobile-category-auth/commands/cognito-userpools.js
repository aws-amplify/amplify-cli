const featureName = 'cognito-userpools'

module.exports = {
  name: featureName,
  run: async (context) => {
    const {print} = context;
    console.log("Here's a list of all the Amplify Cognito Userpool commands!");
  }
}