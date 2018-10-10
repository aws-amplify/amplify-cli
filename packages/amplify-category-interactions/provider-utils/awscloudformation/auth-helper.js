const CategoryName = 'interactions';
const { checkRequirements, externalAuthEnable } = require('amplify-category-auth');

async function ensureAuth(context) {
  const interactionsRequirements = { authSelections: 'identityPoolOnly', allowUnauthenticatedIdentities: true };
  const satisfiedRequirements = await checkRequirements(interactionsRequirements, context);
  const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

  if (foundUnmetRequirements) {
    context.print.warning(`Adding ${CategoryName} would also add the Auth category to the project if not already added.`);
    try {
      await externalAuthEnable(context, CategoryName, '', interactionsRequirements);
    } catch (e) {
      context.print.error(e);
      throw e;
    }
  }
}

module.exports = {
  ensureAuth,
};
