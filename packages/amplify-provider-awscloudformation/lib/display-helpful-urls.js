"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showGraphQLTransformerVersion = exports.showSMSSandboxWarning = exports.displayHelpfulURLs = void 0;
const chalk_1 = __importDefault(require("chalk"));
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const aws_logger_1 = require("./utils/aws-logger");
const aws_sns_1 = require("./aws-utils/aws-sns");
const logger = (0, aws_logger_1.fileLogger)('display-helpful-urls');
const displayHelpfulURLs = async (context, resourcesToBeCreated) => {
    amplify_prompts_1.printer.blankLine();
    showPinpointURL(context, resourcesToBeCreated);
    showGraphQlUrl(context, resourcesToBeCreated);
    await (0, exports.showGraphQLTransformerVersion)(context);
    showRestAPIURL(context, resourcesToBeCreated);
    showHostingURL(context, resourcesToBeCreated);
    showContainerHostingInfo(context, resourcesToBeCreated);
    showHostedUIURLs(context, resourcesToBeCreated);
    await showRekognitionURLS(context, resourcesToBeCreated);
    await showCognitoSandBoxMessage(context, resourcesToBeCreated);
    showGraphQLTransformerMigrationMessage();
    amplify_prompts_1.printer.blankLine();
};
exports.displayHelpfulURLs = displayHelpfulURLs;
const showPinpointURL = (context, resourcesToBeCreated) => {
    const resources = resourcesToBeCreated.filter((resource) => resource.service === 'Pinpoint');
    if (resources.length > 0) {
        const resource = resources[0];
        const { category, resourceName } = resource;
        const amplifyMeta = context.amplify.getProjectMeta();
        if (!amplifyMeta[category][resourceName].output) {
            return;
        }
        const { Id, Region } = amplifyMeta[category][resourceName].output;
        const consoleUrl = `https://${Region}.console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/analytics/overview`;
        amplify_prompts_1.printer.info(`Pinpoint URL to track events ${chalk_1.default.blue.underline(consoleUrl)}`);
    }
};
const showGraphQlUrl = (context, resourcesToBeCreated) => {
    const resources = resourcesToBeCreated.filter((resource) => resource.service === 'AppSync' || (resource.service === 'ElasticContainer' && resource.apiType === 'GRAPHQL'));
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
        }
        else if (authConfig) {
            const apiKeyProvider = [...(authConfig.additionalAuthenticationProviders || []), authConfig.defaultAuthentication].find((provider) => provider.authenticationType === 'API_KEY');
            hasApiKey = !!apiKeyProvider;
        }
        amplify_prompts_1.printer.info(`GraphQL endpoint: ${chalk_1.default.blue.underline(GraphQLAPIEndpointOutput)}`);
        if (hasApiKey) {
            if (GraphQLAPIKeyOutput) {
                amplify_prompts_1.printer.info(`GraphQL API KEY: ${chalk_1.default.blue.underline(GraphQLAPIKeyOutput)}`);
            }
            else {
                amplify_prompts_1.printer.warn(`GraphQL API is configured to use API_KEY authentication, but API Key deployment is disabled, don't forget to create one.`);
            }
        }
        amplify_prompts_1.printer.info('');
    }
};
const showRestAPIURL = (context, resourcesToBeCreated) => {
    const resources = resourcesToBeCreated.filter((resource) => resource.service === 'API Gateway' || resource.service === 'ElasticContainer');
    if (resources.length > 0) {
        const resource = resources[0];
        const { category, resourceName } = resource;
        const amplifyMeta = context.amplify.getProjectMeta();
        if (!amplifyMeta[category][resourceName].output) {
            return;
        }
        const { RootUrl } = amplifyMeta[category][resourceName].output;
        if (RootUrl) {
            amplify_prompts_1.printer.info(`REST API endpoint: ${chalk_1.default.blue.underline(RootUrl)}`);
        }
    }
};
const showContainerHostingInfo = (context, resourcesToBeCreated) => {
    const resource = resourcesToBeCreated.find((resource) => resource.category === 'hosting' && resource.service === 'ElasticContainer' && !resource.hostedZoneId);
    if (resource && resource.output) {
        const { output: { LoadBalancerCnameDomainName, LoadBalancerAliasDomainName, CloudfrontDistributionAliasDomainName, CloudfrontDistributionCnameDomainName, }, } = resource;
        amplify_prompts_1.printer.info(`Make sure to add the following CNAMEs to your domain’s DNS records:\n`);
        const tableOptions = [];
        tableOptions.push(['NAME', 'VALUE']);
        tableOptions.push([LoadBalancerCnameDomainName, LoadBalancerAliasDomainName]);
        tableOptions.push([CloudfrontDistributionCnameDomainName, CloudfrontDistributionAliasDomainName]);
        context.print.table(tableOptions, { format: 'markdown' });
    }
};
const showHostingURL = (context, resourcesToBeCreated) => {
    const resources = resourcesToBeCreated.filter((resource) => resource.service === 'S3AndCloudFront');
    if (resources.length > 0) {
        const resource = resources[0];
        const { category, resourceName } = resource;
        const amplifyMeta = context.amplify.getProjectMeta();
        if (!amplifyMeta[category][resourceName].output) {
            return;
        }
        const { CloudFrontSecureURL, WebsiteURL } = amplifyMeta[category][resourceName].output;
        const hostingEndpoint = CloudFrontSecureURL || WebsiteURL;
        amplify_prompts_1.printer.info(`Hosting endpoint: ${chalk_1.default.blue.underline(hostingEndpoint)}`);
    }
};
const showHostedUIURLs = (context, resourcesToBeCreated) => {
    const resources = resourcesToBeCreated.filter((resource) => resource.service === 'Cognito');
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
            amplify_prompts_1.printer.info(`Hosted UI Endpoint: ${chalk_1.default.blue.underline(hostedUIEndpoint)}`);
            const redirectURIs = oAuthMetadata.CallbackURLs.concat(oAuthMetadata.LogoutURLs);
            if (redirectURIs.length > 0) {
                const [responseType] = oAuthMetadata.AllowedOAuthFlows;
                const testHostedUIEndpoint = `https://${HostedUIDomain}.auth.${Region}.amazoncognito.com/login?response_type=${responseType === 'implicit' ? 'token' : 'code'}&client_id=${AppClientIDWeb}&redirect_uri=${redirectURIs[0]}\n`;
                amplify_prompts_1.printer.info(`Test Your Hosted UI Endpoint: ${chalk_1.default.blue.underline(testHostedUIEndpoint)}`);
            }
        }
    }
};
const showCognitoSandBoxMessage = async (context, resources) => {
    const cognitoResource = resources.filter((resource) => resource.service === 'Cognito');
    if (cognitoResource.length > 0) {
        logger('showCognitoSandBoxMessage', [cognitoResource[0].resourceName])();
        const smsWorkflowEnabled = await context.amplify.invokePluginMethod(context, 'auth', 'cognito', 'isSMSWorkflowEnabled', [
            context,
            cognitoResource[0].resourceName,
        ]);
        if (smsWorkflowEnabled) {
            await (0, exports.showSMSSandboxWarning)(context);
        }
    }
};
const showRekognitionURLS = async (context, resourcesToBeCreated) => {
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
const showSMSSandboxWarning = async (context) => {
    const log = logger('showSMSSandBoxWarning', []);
    const cliUpdateWarning = await amplify_cli_core_1.BannerMessage.getMessage('COGNITO_SMS_SANDBOX_UPDATE_WARNING');
    const smsSandBoxMissingPermissionWarning = await amplify_cli_core_1.BannerMessage.getMessage('COGNITO_SMS_SANDBOX_MISSING_PERMISSION');
    const sandboxModeWarning = await amplify_cli_core_1.BannerMessage.getMessage('COGNITO_SMS_SANDBOX_SANDBOXED_MODE_WARNING');
    const productionModeInfo = await amplify_cli_core_1.BannerMessage.getMessage('COGNITO_SMS_SANDBOX_PRODUCTION_MODE_INFO');
    if (!cliUpdateWarning) {
        return;
    }
    try {
        const snsClient = await aws_sns_1.SNS.getInstance(context);
        const sandboxStatus = await snsClient.isInSandboxMode();
        if (sandboxStatus) {
            if (sandboxModeWarning) {
                amplify_prompts_1.printer.warn(sandboxModeWarning);
            }
        }
        else if (productionModeInfo) {
            amplify_prompts_1.printer.warn(productionModeInfo);
        }
    }
    catch (e) {
        if (e.code === 'AuthorizationError') {
            if (smsSandBoxMissingPermissionWarning) {
                amplify_prompts_1.printer.warn(smsSandBoxMissingPermissionWarning);
            }
        }
        else if (e instanceof TypeError) {
            amplify_prompts_1.printer.warn(cliUpdateWarning);
        }
        else if (e.code === 'ResourceNotFound') {
        }
        else if (e.code === 'UnknownEndpoint') {
            log(e);
        }
        else {
            throw new amplify_cli_core_1.AmplifyFault('SnsSandboxModeCheckFault', {
                message: e.message,
                code: e.code,
            }, e);
        }
    }
};
exports.showSMSSandboxWarning = showSMSSandboxWarning;
const showGraphQLTransformerMigrationMessage = () => {
    const hasGraphqlApi = !!Object.entries(amplify_cli_core_1.stateManager.getMeta().api || {})
        .filter(([__, apiResource]) => apiResource.service === 'AppSync')
        .map(([name]) => name).length;
    const suppressMessage = amplify_cli_core_1.FeatureFlags.getBoolean('graphqltransformer.suppressSchemaMigrationPrompt');
    const usingV2 = amplify_cli_core_1.FeatureFlags.getNumber('graphqltransformer.transformerVersion') === 2;
    if (!hasGraphqlApi || suppressMessage || usingV2) {
        return;
    }
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.warn('Amplify CLI has made improvements to GraphQL APIs. Improvements include pipeline resolvers support, deny-by-default authorization, and improved search and result aggregations.');
    amplify_prompts_1.printer.info('For more information, see https://docs.amplify.aws/cli/migration/transformer-migration/');
    amplify_prompts_1.printer.info(`To get started, run 'amplify migrate api'`);
};
const showGraphQLTransformerVersion = async (context) => {
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const apiObject = (meta && meta.api) || {};
    const hasGraphqlApi = !!Object.entries(apiObject)
        .filter(([__, apiResource]) => apiResource.service === 'AppSync')
        .map(([name]) => name).length;
    if (!hasGraphqlApi) {
        return;
    }
    const transformerVersion = await amplify_cli_core_1.ApiCategoryFacade.getTransformerVersion(context);
    amplify_prompts_1.printer.info(`GraphQL transformer version: ${transformerVersion}`);
};
exports.showGraphQLTransformerVersion = showGraphQLTransformerVersion;
//# sourceMappingURL=display-helpful-urls.js.map