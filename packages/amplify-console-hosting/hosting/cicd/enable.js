const open = require('open');
const utils = require('../../utils/amplify-context-utils');
const questions = require('../../modules/questions/question-generator');
const configUtils = require('../../utils/config-utils');
const constants = require('../../constants/plugin-constants');
const clientFactory = require('../../utils/client-factory');
const path = require('path');
const ValidationError = require('../../error/validation-error').default;

async function enable(context) {
    const region = utils.getRegionForCurrEnv(context);
    const appId = utils.getAppIdForCurrEnv(context);
    const category = constants.CATEGORY;
    const resourceName = constants.CONSOLE_RESOURCE_NAME;
    const type = constants.TYPE_CICD;
    await open(`https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}`);

    const doConfirm = await questions.askCICDConfirmQuestion(context);

    if (!doConfirm) {
        return;
    }
    await validateCICDApp(context, appId);
    // Init template
    const templateFilePath = path.join(__dirname, '..', constants.TEMPLATE_DIR, constants.TEMPLATE_FILE_NAME);
    configUtils.initCFNTemplate(context, templateFilePath);

    // Init meta
    configUtils.initMetaFile(context, category, resourceName, type);

    // Init team-provider-info
    configUtils.initTeamProviderInfo(context, category, resourceName, type);

    // Init backend config
    configUtils.initBackendConfig(context, category, resourceName, type);
}

async function validateCICDApp(context, appId) {
    const amplifyClient = await clientFactory.getAmplifyClient(context);
    const result = await amplifyClient.listBranches({
        appId: appId
    }).promise();
    if (result.branches.length === 0) {
        throw new ValidationError('No change was detected');
    }
}

module.exports = {
    enable
}
