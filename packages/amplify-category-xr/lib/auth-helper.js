const constants = require('./constants');
const { checkRequirements, externalAuthEnable } = require('amplify-category-auth');

async function ensureAuth(context) {
  const xrRequirements = { authSelections: 'identityPoolOnly', allowUnauthenticatedIdentities: true };
  const satisfiedRequirements = await checkRequirements(xrRequirements, context);
  const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

  if (foundUnmetRequirements) {
    context.print.warning(`Adding ${constants.CategoryName} would also add the Auth category to the project if not already added.`);
    try {
      await externalAuthEnable(context, constants.CategoryName, constants.ServiceName, xrRequirements);
    } catch (e) {
      context.print.error(e);
      throw e;
    }
  }
}

module.exports = {
  ensureAuth,
};
