const chalk = require('chalk');

async function displayHelpfulURLs(context, resourcesToBeCreated) {
  context.print.info('');
  context.print.info(chalk.red('Helpful URLs:'));
  context.print.info('======================');
  showPinpointURL(context, resourcesToBeCreated);
  showGraphQLURL(context, resourcesToBeCreated);
  showHostingURL(context, resourcesToBeCreated);
  context.print.info('');
}

function showPinpointURL(context, resourcesToBeCreated) {
  const resources = resourcesToBeCreated.filter(resource => resource.service === 'Pinpoint');
  // There can only be one analytics resource
  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const amplifyMeta = context.amplify.getProjectMeta();
    if (!amplifyMeta[category][resourceName].output) {
      return;
    }
    const { Id, Region } =
        amplifyMeta[category][resourceName].output;
    const consoleUrl =
        `https://console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/analytics/events`;

    context.print.info(chalk`Pinpoint URL to track events {blue.underline ${consoleUrl}}`);
  }
}

function showGraphQLURL(context, resourcesToBeCreated) {
  const resources = resourcesToBeCreated.filter(resource => resource.service === 'AppSync');
  // There can only be one appsync resource
  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const amplifyMeta = context.amplify.getProjectMeta();
    if (!amplifyMeta[category][resourceName].output) {
      return;
    }
    const { GraphQLAPIEndpointOutput, securityType, GraphQLAPIKeyOutput } =
        amplifyMeta[category][resourceName].output;

    if (!GraphQLAPIEndpointOutput) {
      return;
    }

    context.print.info(chalk`GraphQL endpoint: {blue.underline ${GraphQLAPIEndpointOutput}}`);
    if (securityType === 'API_KEY') {
      context.print.info(chalk.blue(`GraphQL API KEY: ${GraphQLAPIKeyOutput}`));
      context.print.info(chalk`GraphQL API KEY: {blue.underline ${GraphQLAPIKeyOutput}}`);
    }
  }
}

function showHostingURL(context, resourcesToBeCreated) {
  const resources = resourcesToBeCreated.filter(resource => resource.service === 'S3AndCloudFront');
  // There can only be one appsync resource
  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const amplifyMeta = context.amplify.getProjectMeta();
    if (!amplifyMeta[category][resourceName].output) {
      return;
    }
    const { CloudFrontSecureURL, WebsiteURL } =
        amplifyMeta[category][resourceName].output;

    const hostingEndpoint = CloudFrontSecureURL || WebsiteURL;

    context.print.info(chalk`Hosting endpoint: {blue.underline ${hostingEndpoint}}`);
  }
}


module.exports = {
  displayHelpfulURLs,
};
