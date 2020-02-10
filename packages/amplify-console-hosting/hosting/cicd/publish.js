const open = require('open');
const utils = require('../../utils/amplify-context-utils');
const questions = require('../../modules/questions/question-generator');
const configUtils = require('../../utils/config-utils');
const constants = require('../../constants/plugin-constants');
const clientFactory = require('../../utils/client-factory');
const path = require('path');
const ValidationError = require('../../error/validation-error').default;

async function publish(context) {
    const region = utils.getRegionForCurrEnv(context);
    const appId = utils.getAppIdForCurrEnv(context);
    if (await questions.askViewAppQuestion()) {
        await open(`https://${region}.console.aws.amazon.com/amplify/home?region=${region}#/${appId}`);
    }
}

module.exports = {
    publish
}