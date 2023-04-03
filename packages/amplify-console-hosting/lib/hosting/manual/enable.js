const path = require('path');
const constants = require('../../constants/plugin-constants');
const configUtils = require('../../utils/config-utils');
const messageConstants = require('../../constants/question-constants');
async function enable(context) {
    const category = constants.CATEGORY;
    const resourceName = constants.CONSOLE_RESOURCE_NAME;
    const type = constants.TYPE_MANUAL;
    const templateFilePath = path.join(__dirname, '..', constants.TEMPLATE_DIR, constants.TEMPLATE_FILE_NAME);
    configUtils.initCFNTemplate(context, templateFilePath);
    configUtils.initBackendConfig(context, category, resourceName, type);
    await configUtils.initMetaFile(context, category, resourceName, type);
    await configUtils.initHostingEnvParams(context, category, resourceName, type);
    context.print.info('');
    context.print.info(messageConstants.POST_ADDING_MESSAGE);
    context.print.info('');
    context.print.info(messageConstants.POST_PUBLISH_MESSAGE);
}
module.exports = {
    enable,
};
//# sourceMappingURL=enable.js.map