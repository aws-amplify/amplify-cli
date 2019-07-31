const chalk = require('chalk');
const { predictionsConsole } = require('amplify-category-predictions');

async function displayHelpfulURLs(context, resourcesToBeCreated) {
  context.print.info('');
  showPinpointURL(context, resourcesToBeCreated);
  showGraphQLURL(context, resourcesToBeCreated);
  showHostingURL(context, resourcesToBeCreated);
  showHostedUIURLs(context, resourcesToBeCreated);
  showRekognitionURLS(context, resourcesToBeCreated);
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
      `https://${Region}.console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/analytics/overview`;
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

function showHostedUIURLs(context, resourcesToBeCreated) {
  const resources = resourcesToBeCreated.filter(resource => resource.service === 'Cognito');

  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const amplifyMeta = context.amplify.getProjectMeta();
    if (!amplifyMeta[category][resourceName].output) {
      return;
    }
    const { Region } = amplifyMeta.providers.awscloudformation;

    const { HostedUIDomain, AppClientIDWeb, OAuthMetadata } =
    amplifyMeta[category][resourceName].output;


    if (OAuthMetadata) {
      const oAuthMetadata = JSON.parse(OAuthMetadata);
      const hostedUIEndpoint = `https://${HostedUIDomain}.auth.${Region}.amazoncognito.com/`;
      context.print.info(chalk`Hosted UI Endpoint: {blue.underline ${hostedUIEndpoint}}`);
      const redirectURIs = oAuthMetadata.CallbackURLs.concat(oAuthMetadata.LogoutURLs);
      if (redirectURIs.length > 0) {
        const testHostedUIEndpoint = `https://${HostedUIDomain}.auth.${Region}.amazoncognito.com/login?response_type=code&client_id=${AppClientIDWeb}&redirect_uri=${redirectURIs[0]}\n`;
        context.print.info(chalk`Test Your Hosted UI Endpoint: {blue.underline ${testHostedUIEndpoint}}`);
      }
    }
  }
}

async function showRekognitionURLS(context, resourcesToBeCreated) {
  const resource = resourcesToBeCreated.find((resource) => {
    if (resource.identifyType && resource.identifyType === 'identifyEntities') {
      return true;
    }
    return false;
  });
  if (resource) {
    const { category, resourceName } = resource;
    const amplifyMeta = context.amplify.getProjectMeta();
    if (!amplifyMeta[category][resourceName].output) {
      return;
    }
    await predictionsConsole.printRekognitionUploadUrl(context, resourceName, amplifyMeta, true);
  }
}

module.exports = {
  displayHelpfulURLs,
};
