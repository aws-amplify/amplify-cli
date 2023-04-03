"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryPrependSecretsUsageExample = exports.tryUpdateTopLevelComment = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const os_1 = require("os");
const path_1 = __importDefault(require("path"));
const constants_1 = require("../../../constants");
const lodash_1 = __importDefault(require("lodash"));
const amplify_cli_core_1 = require("amplify-cli-core");
const tryUpdateTopLevelComment = (resourceDirPath, envVars) => {
    const sourceFilePath = getSourceFilePath(resourceDirPath);
    if (!sourceFilePath) {
        return;
    }
    const newComment = createTopLevelComment(envVars);
    updateTopLevelComment(sourceFilePath, newComment);
};
exports.tryUpdateTopLevelComment = tryUpdateTopLevelComment;
const createTopLevelComment = (envVars) => `${constants_1.topLevelCommentPrefix}${envVars.sort().join(`${os_1.EOL}\t`)}${constants_1.topLevelCommentSuffix}`;
const updateTopLevelComment = (filePath, newComment) => {
    const commentRegex = new RegExp(`${lodash_1.default.escapeRegExp(constants_1.topLevelCommentPrefix)}[a-zA-Z0-9\\-\\s._=]+${lodash_1.default.escapeRegExp(constants_1.topLevelCommentSuffix)}`);
    let fileContents = fs_extra_1.default.readFileSync(filePath).toString();
    const commentMatches = fileContents.match(commentRegex);
    if (!commentMatches || commentMatches.length === 0) {
        fileContents = newComment + fileContents;
    }
    else {
        fileContents = fileContents.replace(commentRegex, newComment);
    }
    fs_extra_1.default.writeFileSync(filePath, fileContents);
};
const getSourceFilePath = (resourceDirPath) => {
    const appJSFilePath = path_1.default.join(resourceDirPath, 'src', 'app.js');
    const indexJSFilePath = path_1.default.join(resourceDirPath, 'src', 'index.js');
    return fs_extra_1.default.existsSync(appJSFilePath) ? appJSFilePath : fs_extra_1.default.existsSync(indexJSFilePath) ? indexJSFilePath : undefined;
};
const tryPrependSecretsUsageExample = async (functionName, secretNames) => {
    const sourceFilePath = getSourceFilePath(path_1.default.join(amplify_cli_core_1.pathManager.getBackendDirPath(), constants_1.categoryName, functionName));
    if (!sourceFilePath) {
        return;
    }
    const secretsHeader = (secretNames === null || secretNames === void 0 ? void 0 : secretNames.length) > 0 ? secretsUsageTemplate(secretNames) : '';
    let fileContent = await fs_extra_1.default.readFile(sourceFilePath, 'utf8');
    const match = fileContent.match(secretsUsageRegex);
    if ((match === null || match === void 0 ? void 0 : match.length) > 0) {
        fileContent = fileContent.replace(secretsUsageRegex, secretsHeader);
    }
    else {
        fileContent = secretsHeader + fileContent;
    }
    await fs_extra_1.default.writeFile(sourceFilePath, fileContent);
};
exports.tryPrependSecretsUsageExample = tryPrependSecretsUsageExample;
const secretsUsageHeader = `/*${os_1.EOL}Use the following code to retrieve configured secrets from SSM:`;
const secretsUsageFooter = `Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]${os_1.EOL}*/${os_1.EOL}`;
const secretsUsageTemplate = (secretNames) => `${secretsUsageHeader}

const aws = require('aws-sdk');

const { Parameters } = await (new aws.SSM())
  .getParameters({
    Names: ${JSON.stringify(secretNames)}.map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();

${secretsUsageFooter}`;
const secretsUsageRegex = new RegExp(`${lodash_1.default.escapeRegExp(secretsUsageHeader)}.+${lodash_1.default.escapeRegExp(secretsUsageFooter)}`, 'sm');
//# sourceMappingURL=updateTopLevelComment.js.map