// @ts-check
import chalk from 'chalk';
import { BannerMessage, stateManager, FeatureFlags, ApiCategoryFacade, AmplifyFault, $TSAny } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { fileLogger } from './utils/aws-logger';
import { SNS } from './aws-utils/aws-sns';

const logger = fileLogger('display-helpful-urls');

/**
 * display helpful urls for the user
 */
export const displayHelpfulURLs = async (context, resourcesToBeCreated): Promise<void> => {
  printer.blankLine();
  showPinpointURL(context, resourcesToBeCreated);
  showGraphQlUrl(context, resourcesToBeCreated);
  await showGraphQLTransformerVersion(context);
  showRestAPIURL(context, resourcesToBeCreated);
  showHostingURL(context, resourcesToBeCreated);
  showContainerHostingInfo(context, resourcesToBeCreated);
  showHostedUIURLs(context, resourcesToBeCreated);
  await showRekognitionURLS(context, resourcesToBeCreated);
  await showCognitoSandBoxMessage(context, resourcesToBeCreated);
  showGraphQLTransformerMigrationMessage();
  printer.blankLine();
};

const showPinpointURL = (context, resourcesToBeCreated): void => {
  const resources = resourcesToBeCreated.filter((resource) => resource.service === 'Pinpoint');
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
    printer.info(`Pinpoint URL to track events ${chalk.blue.underline(consoleUrl)}`);
  }
};

const showGraphQlUrl = (context, resourcesToBeCreated) => {
  const resources = resourcesToBeCreated.filter(
    (resource) => resource.service === 'AppSync' || (resource.service === 'ElasticContainer' && resource.apiType === 'GRAPHQL'),
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
        (provider) => provider.authenticationType === 'API_KEY',
      );

      hasApiKey = !!apiKeyProvider;
    }

    printer.info(`GraphQL endpoint: ${chalk.blue.underline(GraphQLAPIEndpointOutput)}`);
    if (hasApiKey) {
      if (GraphQLAPIKeyOutput) {
        printer.info(`GraphQL API KEY: ${chalk.blue.underline(GraphQLAPIKeyOutput)}`);
      } else {
        printer.warn(
          `GraphQL API is configured to use API_KEY authentication, but API Key deployment is disabled, don't forget to create one.`,
        );
      }
    }

    printer.info('');
  }
};

const showRestAPIURL = (context, resourcesToBeCreated) => {
  const resources = resourcesToBeCreated.filter(
    (resource) => resource.service === 'API Gateway' || resource.service === 'ElasticContainer',
  );

  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const amplifyMeta = context.amplify.getProjectMeta();
    if (!amplifyMeta[category][resourceName].output) {
      return;
    }
    const { RootUrl } = amplifyMeta[category][resourceName].output;

    if (RootUrl) {
      printer.info(`REST API endpoint: ${chalk.blue.underline(RootUrl)}`);
    }
  }
};

const showContainerHostingInfo = (context, resourcesToBeCreated) => {
  const resource = resourcesToBeCreated.find(
    (resource) => resource.category === 'hosting' && resource.service === 'ElasticContainer' && !resource.hostedZoneId,
  );
  if (resource && resource.output) {
    const {
      output: {
        LoadBalancerCnameDomainName,
        LoadBalancerAliasDomainName,
        CloudfrontDistributionAliasDomainName,
        CloudfrontDistributionCnameDomainName,
      },
    } = resource;

    printer.info(`Make sure to add the following CNAMEs to your domain’s DNS records:\n`);

    const tableOptions = [];
    tableOptions.push(['NAME', 'VALUE']);
    tableOptions.push([LoadBalancerCnameDomainName, LoadBalancerAliasDomainName]);
    tableOptions.push([CloudfrontDistributionCnameDomainName, CloudfrontDistributionAliasDomainName]);

    context.print.table(tableOptions, { format: 'markdown' });
  }
};

const showHostingURL = (context, resourcesToBeCreated): void => {
  const resources = resourcesToBeCreated.filter((resource) => resource.service === 'S3AndCloudFront');
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

    printer.info(`Hosting endpoint: ${chalk.blue.underline(hostingEndpoint)}`);
  }
};

const showHostedUIURLs = (context, resourcesToBeCreated): void => {
  const resources = resourcesToBeCreated.filter((resource) => resource.service === 'Cognito');

  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const amplifyMeta = context.amplify.getProjectMeta();
    if (!amplifyMeta[category][resourceName] || !amplifyMeta[category][resourceName].output) {
      return;
    }
    const { Region } = amplifyMeta.providers.awscloudformation;

    const { HostedUIDomain, HostedUICustomDomain, AppClientIDWeb, OAuthMetadata } = amplifyMeta[category][resourceName].output;

    if (OAuthMetadata) {
      const oAuthMetadata = JSON.parse(OAuthMetadata);
      const hostedUIEndpoint = HostedUICustomDomain
        ? `https://${HostedUICustomDomain}`
        : `https://${HostedUIDomain}.auth.${Region}.amazoncognito.com/`;
      printer.info(`Hosted UI Endpoint: ${chalk.blue.underline(hostedUIEndpoint)}`);
      const redirectURIs = oAuthMetadata.CallbackURLs.concat(oAuthMetadata.LogoutURLs);
      if (redirectURIs.length > 0) {
        const [responseType] = oAuthMetadata.AllowedOAuthFlows;

        const testHostedUIEndpoint = `${hostedUIEndpoint}/login?response_type=${
          responseType === 'implicit' ? 'token' : 'code'
        }&client_id=${AppClientIDWeb}&redirect_uri=${redirectURIs[0]}\n`;
        printer.info(`Test Your Hosted UI Endpoint: ${chalk.blue.underline(testHostedUIEndpoint)}`);
      }
    }
  }
};

const showCognitoSandBoxMessage = async (context, resources): Promise<void> => {
  const cognitoResource = resources.filter((resource) => resource.service === 'Cognito');

  if (cognitoResource.length > 0) {
    logger('showCognitoSandBoxMessage', [cognitoResource[0].resourceName])();

    const smsWorkflowEnabled = await context.amplify.invokePluginMethod(context, 'auth', 'cognito', 'isSMSWorkflowEnabled', [
      context,
      cognitoResource[0].resourceName,
    ]);
    if (smsWorkflowEnabled) {
      await showSMSSandboxWarning(context);
    }
  }
};

const showRekognitionURLS = async (context, resourcesToBeCreated): Promise<void> => {
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

    await context.amplify.invokePluginMethod(context, 'predictions', undefined, 'printRekognitionUploadUrl', [
      context,
      resourceName,
      amplifyMeta,
      true,
    ]);
  }
};

/**
 *  displays sms sandbox warning
 */
export const showSMSSandboxWarning = async (context): Promise<void> => {
  const log = logger('showSMSSandBoxWarning', []);

  // This message will be set only after SNS Sandbox  Sandbox API is available and AWS SDK gets updated
  const cliUpdateWarning = await BannerMessage.getMessage('COGNITO_SMS_SANDBOX_UPDATE_WARNING');
  const smsSandBoxMissingPermissionWarning = await BannerMessage.getMessage('COGNITO_SMS_SANDBOX_MISSING_PERMISSION');
  const sandboxModeWarning = await BannerMessage.getMessage('COGNITO_SMS_SANDBOX_SANDBOXED_MODE_WARNING');
  const productionModeInfo = await BannerMessage.getMessage('COGNITO_SMS_SANDBOX_PRODUCTION_MODE_INFO');
  if (!cliUpdateWarning) {
    return;
  }

  try {
    const snsClient = await SNS.getInstance(context);
    const sandboxStatus = await snsClient.isInSandboxMode();

    if (sandboxStatus) {
      if (sandboxModeWarning) {
        printer.warn(sandboxModeWarning);
      }
    } else if (productionModeInfo) {
      printer.warn(productionModeInfo);
    }
  } catch (e) {
    if (e.name === 'AuthorizationError') {
      if (smsSandBoxMissingPermissionWarning) {
        printer.warn(smsSandBoxMissingPermissionWarning);
      }
    } else if (e instanceof TypeError) {
      printer.warn(cliUpdateWarning);
    } else if (e.name === 'ResourceNotFound') {
      // API is not public yet. Ignore it for now. This error should not occur as `COGNITO_SMS_SANDBOX_UPDATE_WARNING` will not be set
    } else if (e.name === 'UnknownEndpoint') {
      // Network error. Sandbox status is for informational purpose and should not stop deployment
      log(e);
    } else {
      throw new AmplifyFault(
        'SnsSandboxModeCheckFault',
        {
          message: e.message,
          code: e.name,
        },
        e,
      );
    }
  }
};

const showGraphQLTransformerMigrationMessage = (): void => {
  const hasGraphqlApi = !!Object.entries(stateManager.getMeta().api || {})
    .filter(([, apiResource]) => (apiResource as $TSAny).service === 'AppSync')
    .map(([name]) => name).length;
  const suppressMessage = FeatureFlags.getBoolean('graphqltransformer.suppressSchemaMigrationPrompt');
  const usingV2 = FeatureFlags.getNumber('graphqltransformer.transformerVersion') === 2;
  if (!hasGraphqlApi || suppressMessage || usingV2) {
    return;
  }
  printer.blankLine();
  printer.warn(
    'Amplify CLI has made improvements to GraphQL APIs. Improvements include pipeline resolvers support, deny-by-default authorization, and improved search and result aggregations.',
  );
  printer.info('For more information, see https://docs.amplify.aws/cli/migration/transformer-migration/');
  printer.info(`To get started, run 'amplify migrate api'`);
};

/**
 * prints graphql transformer migration message
 */
export const showGraphQLTransformerVersion = async (context): Promise<void> => {
  const meta = stateManager.getMeta();
  const apiObject = (meta && meta.api) || {};
  const hasGraphqlApi = !!Object.entries(apiObject)
    .filter(([, apiResource]) => (apiResource as $TSAny).service === 'AppSync')
    .map(([name]) => name).length;

  if (!hasGraphqlApi) {
    return;
  }

  const transformerVersion = await ApiCategoryFacade.getTransformerVersion(context);
  printer.info(`GraphQL transformer version: ${transformerVersion}`);
};
