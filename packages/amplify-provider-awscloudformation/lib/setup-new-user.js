"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const constants_js_1 = __importDefault(require("./constants.js"));
const systemConfigManager = __importStar(require("./system-config-manager"));
const utility_obfuscate_1 = __importDefault(require("./utility-obfuscate"));
const aws_regions_js_1 = __importDefault(require("./aws-regions.js"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const run = async (context) => {
    const awsConfigInfo = {
        accessKeyId: constants_js_1.default.DefaultAWSAccessKeyId,
        secretAccessKey: constants_js_1.default.DefaultAWSSecretAccessKey,
        sessionToken: process.env.AWS_SESSION_TOKEN,
        region: constants_js_1.default.DefaultAWSRegion,
    };
    context.print.info('Follow these steps to set up access to your AWS account:');
    context.print.info('');
    context.print.info('Sign in to your AWS administrator account:');
    context.print.info(chalk_1.default.green(constants_js_1.default.AWSAmazonConsoleUrl));
    (0, amplify_cli_core_1.open)(constants_js_1.default.AWSAmazonConsoleUrl, { wait: false }).catch(() => {
    });
    await context.amplify.pressEnterToContinue.run({ message: 'Press Enter to continue' });
    context.print.info('Specify the AWS Region');
    const answers = await inquirer_1.default.prompt([
        {
            type: 'list',
            name: 'region',
            message: 'region: ',
            choices: aws_regions_js_1.default.regions,
            default: awsConfigInfo.region,
        },
    ]);
    awsConfigInfo.region = answers.region;
    amplify_prompts_1.printer.info('Follow the instructions at');
    amplify_prompts_1.printer.info(constants_js_1.default.CreateIAMUserAmplifyDocs, 'blue');
    amplify_prompts_1.printer.blankLine();
    amplify_prompts_1.printer.info('to complete the user creation in the AWS console');
    amplify_prompts_1.printer.info(constants_js_1.default.AWSCreateIAMUsersUrl, 'blue');
    (0, amplify_cli_core_1.open)(constants_js_1.default.CreateIAMUserAmplifyDocs, { wait: false }).catch(() => {
    });
    (0, amplify_cli_core_1.open)(constants_js_1.default.AWSCreateIAMUsersUrl, { wait: false }).catch(() => {
    });
    await context.amplify.pressEnterToContinue.run({ message: 'Press Enter to continue' });
    context.print.info('Enter the access key of the newly created user:');
    const accountDetails = await inquirer_1.default.prompt([
        {
            type: 'password',
            mask: '*',
            name: 'accessKeyId',
            message: 'accessKeyId: ',
            default: awsConfigInfo.accessKeyId,
            transformer: utility_obfuscate_1.default.transform,
            validate: (input) => {
                if (input === constants_js_1.default.DefaultAWSAccessKeyId || input.length < 16 || input.length > 128 || !/^[\w]+$/.test(input)) {
                    let message = 'You must enter a valid accessKeyId';
                    if (input.length < 16) {
                        message += ': Minimum length is 16';
                    }
                    else if (input.length > 128) {
                        message += ': Maximum length is 128';
                    }
                    else if (!/^[\w]+$/.test(input)) {
                        message += ': It can only contain letter, number or underscore characters';
                    }
                    return message;
                }
                return true;
            },
        },
        {
            type: 'password',
            mask: '*',
            name: 'secretAccessKey',
            message: 'secretAccessKey: ',
            default: awsConfigInfo.secretAccessKey,
            transformer: utility_obfuscate_1.default.transform,
            validate: (input) => {
                if (input === constants_js_1.default.DefaultAWSSecretAccessKey || input.trim().length === 0) {
                    return 'You must enter a valid secretAccessKey';
                }
                return true;
            },
        },
    ]);
    if (accountDetails.accessKeyId) {
        awsConfigInfo.accessKeyId = accountDetails.accessKeyId.trim();
    }
    if (accountDetails.secretAccessKey) {
        awsConfigInfo.secretAccessKey = accountDetails.secretAccessKey.trim();
    }
    if (validateAWSConfig(awsConfigInfo)) {
        let profileName = 'default';
        context.print.warning('This would update/create the AWS Profile in your local machine');
        const profileDetails = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'pn',
                message: 'Profile Name: ',
                default: 'default',
            },
        ]);
        profileName = profileDetails.pn.trim();
        systemConfigManager.setProfile(awsConfigInfo, profileName);
        context.print.info('');
        context.print.success('Successfully set up the new user.');
        return profileName;
    }
    throw new amplify_cli_core_1.AmplifyError('InputValidationError', {
        message: 'Invalid AWS credentials',
        resolution: 'Please check your AWS credentials',
    });
};
exports.run = run;
const validateAWSConfig = (awsConfigInfo) => awsConfigInfo.accessKeyId !== constants_js_1.default.DefaultAWSAccessKeyId && awsConfigInfo.secretAccessKey !== constants_js_1.default.DefaultAWSSecretAccessKey;
//# sourceMappingURL=setup-new-user.js.map