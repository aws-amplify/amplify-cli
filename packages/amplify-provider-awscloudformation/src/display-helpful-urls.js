const chalk = require('chalk');

async function displayHelpfulURLs(context, resourcesToBeCreated) {
  context.print.info('');
  showPinpointURL(context, resourcesToBeCreated);
  showGraphQLURL(context, resourcesToBeCreated);
  showRestAPIURL(context, resourcesToBeCreated);
  showHostingURL(context, resourcesToBeCreated);
  showContainerHostingInfo(context, resourcesToBeCreated);
  showHostedUIURLs(context, resourcesToBeCreated);
  await showRekognitionURLS(context, resourcesToBeCreated);
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
    const { Id, Region } = amplifyMeta[category][resourceName].output;
    const consoleUrl = `https://${Region}.console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/analytics/overview`;
    context.print.info(chalk`Pinpoint URL to track events {blue.underline ${consoleUrl}}`);
  }
}

function showGraphQLURL(context, resourcesToBeCreated) {
  const resources = resourcesToBeCreated.filter(
    resource => resource.service === 'AppSync' || (resource.service === 'ElasticContainer' && resource.apiType === 'GRAPHQL'),
  );

  for (const resource of resources) {
    const { category, resourceName } = resource;
    const amplifyMeta = context.amplify.getProjectMeta();
    if (!amplifyMeta[category][resourceName].output) {
      return;
    }
    const { GraphQLAPIEndpointOutput, securityType, authConfig, GraphQLAPIKeyOutput } = amplifyMeta[category][resourceName].output;

    if (!GraphQLAPIEndpointOutput) {
      return;
    }

    let hasApiKey = false;

    if (securityType) {
      hasApiKey = securityType === 'API_KEY';
    } else if (authConfig) {
      const apiKeyProvider = [...(authConfig.additionalAuthenticationProviders || []), authConfig.defaultAuthentication].find(
        provider => provider.authenticationType === 'API_KEY',
      );

      hasApiKey = !!apiKeyProvider;
    }

    context.print.info(chalk`GraphQL endpoint: {blue.underline ${GraphQLAPIEndpointOutput}}`);
    if (hasApiKey) {
      if (GraphQLAPIKeyOutput) {
        context.print.info(chalk`GraphQL API KEY: {blue.underline ${GraphQLAPIKeyOutput}}`);
      } else {
        context.print.warning(
          chalk`GraphQL API is configured to use API_KEY authentication, but API Key deployment is disabled, don't forget to create one.`,
        );
      }
    }

    context.print.info('');
  }
}

function showRestAPIURL(context, resourcesToBeCreated) {
  const resources = resourcesToBeCreated.filter(resource => resource.service === 'API Gateway' || resource.service === 'ElasticContainer');

  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const amplifyMeta = context.amplify.getProjectMeta();
    if (!amplifyMeta[category][resourceName].output) {
      return;
    }
    const { RootUrl } = amplifyMeta[category][resourceName].output;

    if (RootUrl) {
      context.print.info(chalk`REST API endpoint: {blue.underline ${RootUrl}}`);
    }
  }
}

function showContainerHostingInfo(context, resourcesToBeCreated) {
  const resource = resourcesToBeCreated.find(resource => resource.category === 'hosting' && resource.service === 'ElasticContainer' && !resource.hostedZoneId);
  if (resource && resource.output) {
    const {
      output: {
        LoadBalancerCnameDomainName,
        LoadBalancerAliasDomainName,
        CloudfrontDistributionAliasDomainName,
        CloudfrontDistributionCnameDomainName
      }
    } = resource;

    context.print.info(`Make sure to add the following CNAMEs to your domain’s DNS records:\n`);

    const tableOptions = [];
    tableOptions.push(['NAME', 'VALUE']);
    tableOptions.push([LoadBalancerCnameDomainName, LoadBalancerAliasDomainName]);
    tableOptions.push([CloudfrontDistributionCnameDomainName, CloudfrontDistributionAliasDomainName]);

    context.print.table(tableOptions, { format: 'markdown' });
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
    const { CloudFrontSecureURL, WebsiteURL } = amplifyMeta[category][resourceName].output;

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
    if (!amplifyMeta[category][resourceName] || !amplifyMeta[category][resourceName].output) {
      return;
    }
    const { Region } = amplifyMeta.providers.awscloudformation;

    const { HostedUIDomain, AppClientIDWeb, OAuthMetadata } = amplifyMeta[category][resourceName].output;

    if (OAuthMetadata) {
      const oAuthMetadata = JSON.parse(OAuthMetadata);
      const hostedUIEndpoint = `https://${HostedUIDomain}.auth.${Region}.amazoncognito.com/`;
      context.print.info(chalk`Hosted UI Endpoint: {blue.underline ${hostedUIEndpoint}}`);
      const redirectURIs = oAuthMetadata.CallbackURLs.concat(oAuthMetadata.LogoutURLs);
      if (redirectURIs.length > 0) {
        const [responseType] = oAuthMetadata.AllowedOAuthFlows;

        const testHostedUIEndpoint = `https://${HostedUIDomain}.auth.${Region}.amazoncognito.com/login?response_type=${
          responseType === 'implicit' ? 'token' : 'code'
        }&client_id=${AppClientIDWeb}&redirect_uri=${redirectURIs[0]}\n`;
        context.print.info(chalk`Test Your Hosted UI Endpoint: {blue.underline ${testHostedUIEndpoint}}`);
      }
    }
  }
}

async function showRekognitionURLS(context, resourcesToBeCreated) {
  const resource = resourcesToBeCreated.find(resource => {
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

    await context.amplify.invokePluginMethod(context, 'predictions', undefined, 'printRekognitionUploadUrl', [
      context,
      resourceName,
      amplifyMeta,
      true,
    ]);
  }
}

module.exports = {
  displayHelpfulURLs,
};
