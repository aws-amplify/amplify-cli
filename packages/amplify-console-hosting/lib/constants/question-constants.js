"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST_PUBLISH_MESSAGE = exports.POST_ADDING_MESSAGE = exports.APP_CICD_SERVE_QUESTION = exports.APP_CONFIGURE_QUESTION = exports.VIEW_APP_QUESTION = exports.CICD_CONFIRM_QUESTION = exports.LEARN_MORE = exports.DEPLOY_TYPE_QUESTION_CICD = exports.DEPLOY_TYPE_QUESTION_MANUAL = exports.DEPLOY_TYPE_QUESTION = void 0;
const chalk_1 = __importDefault(require("chalk"));
exports.DEPLOY_TYPE_QUESTION = `Choose a ${chalk_1.default.red('type')}`;
exports.DEPLOY_TYPE_QUESTION_MANUAL = 'Manual deployment';
exports.DEPLOY_TYPE_QUESTION_CICD = 'Continuous deployment (Git-based deployments)';
exports.LEARN_MORE = 'Learn more';
exports.CICD_CONFIRM_QUESTION = 'Continuous deployment is configured in the Amplify Console. Please hit enter once you connect your repository';
exports.VIEW_APP_QUESTION = `You have set up continuous deployment with Amplify Console. \
Run ${chalk_1.default.green('git push')} from a connected branch to publish updates. \
Open your Amplify Console app to view connected branches?`;
exports.APP_CONFIGURE_QUESTION = 'Configure settings such as custom domains, redirects, and password protection using the Amplify Console. Continue?';
exports.APP_CICD_SERVE_QUESTION = 'You have set up continuous deployment with Amplify Console. Open your Amplify Console app to view connected branches?';
exports.POST_ADDING_MESSAGE = `${chalk_1.default.green('You can now publish your app using the following command:')}`;
exports.POST_PUBLISH_MESSAGE = 'Command: amplify publish';
//# sourceMappingURL=question-constants.js.map