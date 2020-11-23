// @ts-check
const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');
const open = require('open');
const chalk = require('chalk');
const constants = require('../constants');
const fileUploader = require('../../../amplify-category-hosting/lib/S3AndCloudFront/helpers/file-uploader');
const {
    EcsAlbStack,
    NETWORK_STACK_LOGICAL_ID,
    DEPLOYMENT_MECHANISM,
    processDockerConfig
} = require('amplify-category-api');

const serviceName = 'ElasticContainer';
const categoryName = 'hosting';
const resourceName = 'site';
const providerPlugin = 'awscloudformation';

const templateFileName = 'template.json';

async function enable(context) {
    context.print.info('You can register a domain using Route 53: aws.amazon.com/route53/ or use an existing domain.\n');

    const { domain } = await inquirer.prompt({
        name: 'domain',
        message: 'Provide your web app endpoint (e.g. app.example.com or www.example.com):',
        type: 'input',
        validate: CheckIsValidDomain
    });

    /** @type {AWS.Route53.HostedZone} */
    const domainZone = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'isDomainInZones', {
        domain
    });

    const { Id: hostedZoneKey = "" } = domainZone || {};

    const [, hostedZoneId] = hostedZoneKey.match(/^\/hostedzone\/(.+)/) || [];

    const { restrictAccess } = await inquirer.prompt({
        name: 'restrictAccess',
        message: 'Do you want to automatically protect your web app using Amazon Cognito Hosted UI',
        type: 'confirm',
        default: false
    });

    return generateHostingResources(context, { domain, hostedZoneId, restrictAccess }, true);

}

export async function generateHostingResources(context, { domain, restrictAccess, hostedZoneId }, addResource = false) {
    const dependsOn = [];

    let authName;
    if (restrictAccess) {
        const apiRequirements = { authSelections: 'identityPoolAndUserPool' };
        // getting requirement satisfaction map
        const satisfiedRequirements = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
            apiRequirements,
            context,
            'api',
            resourceName,
        ]);
        // checking to see if any requirements are unsatisfied
        const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

        if (foundUnmetRequirements) {
            try {
                authName = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
                    context,
                    'api',
                    resourceName,
                    apiRequirements,
                ]);
            } catch (e) {
                context.print.error(e);
                throw e;
            }
        } else {
            [authName] = Object.keys(context.amplify.getProjectDetails().amplifyMeta.auth);
        }

        // get auth dependency if exists to avoid duplication
        const authDependency = dependsOn.find(dependency => dependency.category === 'auth');

        if (authDependency === undefined) {
            dependsOn.push({
                category: 'auth',
                resourceName: authName,
                attributes: ['UserPoolId', 'AppClientIDWeb', 'HostedUIDomain'],
            });
        } else {
            const existingAttributes = authDependency.attributes;

            const newAttributes = new Set([...existingAttributes, 'UserPoolId', 'AppClientIDWeb', 'HostedUIDomain']);

            authDependency.attributes = Array.from(newAttributes);
        }
    }

    const providerName = 'awscloudformation';
    const {
        providers: { [providerName]: provider },
    } = context.amplify.getProjectMeta();
    const { StackName: envName, DeploymentBucketName: deploymentBucketName, Region: region } = provider;
    // const { auth } = context.amplify.getProjectDetails().amplifyMeta;


    dependsOn.push({
        category: '',
        resourceName: NETWORK_STACK_LOGICAL_ID,
        attributes: ['ClusterName', 'VpcId', 'VpcCidrBlock', 'SubnetIds', 'VpcLinkId', 'CloudMapNamespaceId'],
    });

    const { frontend } = context.amplify.getProjectConfig();
    const { config: { SourceDir: src } } = context.amplify.getProjectConfig()[frontend];

    const { projectPath } = context.amplify.getEnvInfo();
    const srcPath = path.join(projectPath, src);

    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

    /** @type {import('amplify-category-api').ApiResource & {service: string, domain: string, providerPlugin:string}} */
    const resource = {
        resourceName,
        service: serviceName,
        providerPlugin,
        domain,
        authName,
        restrictAccess,
        // apiType: undefined,
        category: categoryName,
        categoryPolicies: [], // TODO: add question
        dependsOn,
        deploymentMechanism: DEPLOYMENT_MECHANISM.FULLY_MANAGED,
        environmentMap: {}, // TODO: permissions question
        mutableParametersState: {}, // TODO
        exposedContainer: undefined,
        // gitHubInfo,
        output: {}, // TODO next ime?
    };

    const {
        containers,
        containersPorts,
        desiredCount,
        exposedContainer,
        isInitialDeploy,
        secretsArns,
    } = await processDockerConfig(context, resource, srcPath);

    resource.exposedContainer = exposedContainer;

    const stack = new EcsAlbStack(undefined, 'ContainersHosting', {
        envName,
        categoryName,
        apiName: resourceName,
        authName,
        dependsOn,
        policies: [], // TODO
        deploymentBucketName,
        restrictAccess,
        createCloudMapService: false,
        secretsArns,
        isInitialDeploy,
        deploymentMechanism: resource.deploymentMechanism,
        domainName: resource.domain,
        desiredCount,
        hostedZoneId,
        containers,
        exposedContainer,
        taskPorts: containersPorts,
        gitHubSourceActionInfo: undefined,
        taskEnvironmentVariables: {}, // TODO
    });

    context.exeInfo.template = stack.toCloudFormation();

    const resourceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
    fs.ensureDirSync(resourceDirPath);

    const templateFilePath = path.join(resourceDirPath, templateFileName);
    let jsonString = JSON.stringify(context.exeInfo.template, null, 4);
    fs.writeFileSync(templateFilePath, jsonString, 'utf8');

    if (addResource) {
        return context.amplify.updateamplifyMetaAfterResourceAdd(constants.CategoryName, serviceName, resource);
    } else {
        await context.amplify.updateamplifyMetaAfterResourceUpdate(constants.CategoryName, serviceName, 'exposedContainer', exposedContainer);
    }
}

function CheckIsValidDomain(domain) {
    var re = new RegExp(/^(\*\.)?(((?!-)[A-Za-z0-9-]{0,62}[A-Za-z0-9])\.)+((?!-)[A-Za-z0-9-]{1,62}[A-Za-z0-9])$/);
    const validDomain = re.test(domain);

    return validDomain || `Domain ${domain} invalid`;
}

async function configure(context) {

}

async function publish(context, args) {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

    const zipFile = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'zipFiles',
        [projectBackendDirPath, path.join(projectBackendDirPath, 'bundle.zip')]);

    // Upload zipFile and show pipeline url
}

function console(context) {
    // Check this behavior
    const amplifyMeta = context.amplify.getProjectMeta();
    const { HostingBucketName: bucket, Region: region } = amplifyMeta[constants.CategoryName][serviceName].output;
    const consoleUrl = `xxxx`;
    context.print.info(consoleUrl);
    //   open(consoleUrl, { wait: false });
}

async function migrate(context) {

}

module.exports = {
    enable,
    configure,
    publish,
    console,
    migrate,
};
