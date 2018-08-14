async function displayHelpfulURLs(context, resourcesToBeCreated) {
  context.print.info('');
  showPinpointURL(context, resourcesToBeCreated);
  showGraphQLURL(context, resourcesToBeCreated);
  context.print.info('');
}

function showPinpointURL(context, resourcesToBeCreated) {
  const resources = resourcesToBeCreated.filter(resource => resource.service === 'Pinpoint');
  // There can only be one analytics resource
  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const amplifyMeta = context.amplify.getProjectMeta();
    const { Id, Region } =
        amplifyMeta[category][resourceName].output;
    const consoleUrl =
        `https://console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/analytics/events`;

    context.print.success(`Pinpoint URL to track events: ${consoleUrl}`);
  }
}

function showGraphQLURL(context, resourcesToBeCreated) {
  const resources = resourcesToBeCreated.filter(resource => resource.service === 'AppSync');
  // There can only be one appsync resource
  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const amplifyMeta = context.amplify.getProjectMeta();
    const { GraphQLAPIEndpointOutput, securityType, GraphQLAPIKeyOutput } =
        amplifyMeta[category][resourceName].output;

    context.print.success(`GraphQL endpoint: ${GraphQLAPIEndpointOutput}`);
    if (securityType === 'API_KEY') {
      context.print.success(`GraphQL API KEY: ${GraphQLAPIKeyOutput}`);
    }
  }
}


module.exports = {
  displayHelpfulURLs,
};
