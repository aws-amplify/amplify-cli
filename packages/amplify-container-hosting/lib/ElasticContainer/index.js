const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');
const open = require('open');
const chalk = require('chalk');
const constants = require('../constants');
const fileUploader = require('../../../amplify-category-hosting/lib/S3AndCloudFront/helpers/file-uploader');

const serviceName = 'ElasticContainer';
const providerPlugin = 'awscloudformation';

const templateFileName = 'template.json';

async function enable(context) {
    let templateFilePath = path.join(__dirname, templateFileName);
    context.exeInfo.template = context.amplify.readJsonFile(templateFilePath);

    context.print.info('You can register a domain using Route 53: aws.amazon.com/route53/ or use an existing domain.\n');

    const { domain } = await inquirer.prompt({
        name: 'domain',
        message: 'Provide your Web App endpoint (e.g. app.myapp.dev or www.myapp.dev):',
        type: 'input',
        validate: CheckIsValidDomain
    });

    context.print.info(context.amplify);

    const domainInZone = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'isDomainInZones', {
        domain
    });

    const { hostedUI } = await inquirer.prompt({
        name: 'hostedUI',
        message: 'Do you want to automatically protect your web app using Amazon Cognito Hosted UI',
        type: 'confirm',
        default: false
    });

    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const serviceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
    fs.ensureDirSync(serviceDirPath);

    templateFilePath = path.join(serviceDirPath, templateFileName);
    let jsonString = JSON.stringify(context.exeInfo.template, null, 4);
    fs.writeFileSync(templateFilePath, jsonString, 'utf8');

    const metaData = {
        service: serviceName,
        providerPlugin,
        domain,
        hostedUI
    };
    return context.amplify.updateamplifyMetaAfterResourceAdd(constants.CategoryName, serviceName, metaData);
}


function CheckIsValidDomain(domain) {
    var re = new RegExp(/^((?:(?:(?:\w[\.\-\+]?)*)\w)+)((?:(?:(?:\w[\.\-\+]?){0,62})\w)+)\.(\w{2,6})$/);
    const validDomain = [].concat(domain.match(re))[0];

    if (!!validDomain) {
        return true;
    }

    return !!validDomain ? true : `Domain ${domain} invalid`;
}

async function configure(context) {

}

function publish(context, args) {
    context.print.info('Publishing hook running yay!');
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

    return context.amplify.executeProviderUtils(context, 'awscloudformation', 'zipFiles', [projectBackendDirPath, path.join(projectBackendDirPath, 'test.zip')]).then(result => console.log('yay done zipping'));
}

function console(context) {
    const amplifyMeta = context.amplify.getProjectMeta();
    const { HostingBucketName: bucket, Region: region } = amplifyMeta[constants.CategoryName][serviceName].output;
    const consoleUrl = `xxxx`;
    context.print.info(chalk.green(consoleUrl));
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
