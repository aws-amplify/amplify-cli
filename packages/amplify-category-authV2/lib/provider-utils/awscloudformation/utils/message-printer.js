'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.printSMSSandboxWarning = exports.getPostUpdateAuthMessagePrinter = exports.getPostAddAuthMessagePrinter = void 0;
const os_1 = require('os');
const amplify_cli_core_1 = require('amplify-cli-core');
const getPostAddAuthMessagePrinter = print => resourceName => {
  print.success(`Successfully added auth resource ${resourceName} locally`);
  printCommonText(print);
};
exports.getPostAddAuthMessagePrinter = getPostAddAuthMessagePrinter;
const getPostUpdateAuthMessagePrinter = print => resourceName => {
  print.success(`Successfully updated auth resource ${resourceName} locally`);
  printCommonText(print);
};
exports.getPostUpdateAuthMessagePrinter = getPostUpdateAuthMessagePrinter;
const printCommonText = print => {
  print.info('');
  print.success('Some next steps:');
  print.info('"amplify push" will build all your local backend resources and provision it in the cloud');
  print.info(
    '"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud',
  );
  print.info('');
};
const printSMSSandboxWarning = async print => {
  const postAddUpdateSMSSandboxInfo = await amplify_cli_core_1.BannerMessage.getMessage(
    'COGNITO_SMS_SANDBOX_CATEGORY_AUTH_ADD_OR_UPDATE_INFO',
  );
  if (postAddUpdateSMSSandboxInfo) {
    print.warning(`${postAddUpdateSMSSandboxInfo}${os_1.EOL}`);
  }
};
exports.printSMSSandboxWarning = printSMSSandboxWarning;
//# sourceMappingURL=message-printer.js.map
