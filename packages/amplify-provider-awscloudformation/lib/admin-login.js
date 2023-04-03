"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeReadline = exports.adminLoginFlow = void 0;
const util_1 = __importDefault(require("util"));
const readline_1 = __importDefault(require("readline"));
const stream_1 = require("stream");
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const admin_helpers_1 = require("./utils/admin-helpers");
const admin_login_server_1 = require("./utils/admin-login-server");
const adminLoginFlow = async (context, appId, envName, region) => {
    var _a, _b;
    envName = envName || context.amplify.getEnvInfo().envName;
    if (!region) {
        const { isAdminApp, region: _region } = await (0, admin_helpers_1.isAmplifyAdminApp)(appId);
        if (!isAdminApp) {
            throw new amplify_cli_core_1.AmplifyError('AmplifyStudioNotEnabledError', {
                message: `Amplify Studio not enabled for appId: ${appId}`,
                link: `${amplify_cli_core_1.AMPLIFY_DOCS_URL}/console/adminui/start/#to-get-started-from-an-existing-amplify-app`,
            });
        }
        region = _region;
    }
    const url = (0, admin_helpers_1.adminVerifyUrl)(appId, envName, region);
    const spinner = new amplify_prompts_1.AmplifySpinner();
    try {
        await (0, amplify_cli_core_1.open)(url, { wait: false });
        amplify_prompts_1.printer.info(`Opening link: ${url}`);
        spinner.start('Confirm login in the browser or manually paste in your CLI login key:\n');
    }
    catch (_) {
        amplify_prompts_1.printer.info(`Could not open ${url} in the current environment`);
        spinner.start('Manually enter your CLI login key:\n');
    }
    try {
        const originUrl = (_a = process.env.AMPLIFY_CLI_ADMINUI_BASE_URL) !== null && _a !== void 0 ? _a : (_b = admin_helpers_1.adminBackendMap[region]) === null || _b === void 0 ? void 0 : _b.amplifyAdminUrl;
        const adminLoginServer = new admin_login_server_1.AdminLoginServer(appId, originUrl, amplify_prompts_1.printer);
        const getTokenViaServer = () => {
            let finished = false;
            let cancel = () => {
                finished = true;
            };
            const promise = new Promise((resolve, reject) => {
                adminLoginServer
                    .startServer(() => {
                    adminLoginServer.shutdown();
                    amplify_prompts_1.printer.success('Successfully received Amplify Studio tokens.');
                    finished = true;
                    resolve();
                })
                    .catch(reject);
                cancel = () => {
                    if (finished) {
                        return;
                    }
                    finished = true;
                    adminLoginServer.shutdown();
                    reject();
                };
            });
            return [promise, cancel];
        };
        const getTokenViaPrompt = () => {
            let finished = false;
            let cancel = () => {
                finished = true;
            };
            const promise = new Promise((resolve, reject) => {
                const hiddenStdout = new stream_1.Writable({
                    write: (__, ___, callback) => {
                        callback();
                    },
                });
                const rl = readline_1.default.createInterface({
                    input: process.stdin,
                    output: hiddenStdout,
                    terminal: true,
                });
                const question = util_1.default.promisify(rl.question).bind(rl);
                question('')
                    .then(async (tokenBase64) => {
                    if (finished) {
                        resolve();
                        return;
                    }
                    try {
                        const tokenJson = JSON.parse(Buffer.from(tokenBase64, 'base64').toString());
                        await adminLoginServer.storeTokens(tokenJson, appId);
                    }
                    catch (e) {
                        amplify_prompts_1.printer.error('Provided token was invalid.');
                        (0, exports.closeReadline)(rl);
                        reject(new Error('Provided token was invalid.'));
                        return;
                    }
                    finished = true;
                    (0, exports.closeReadline)(rl);
                    resolve();
                })
                    .catch(reject);
                cancel = () => {
                    if (finished) {
                        return;
                    }
                    finished = true;
                    (0, exports.closeReadline)(rl);
                    reject();
                };
            });
            return [promise, cancel];
        };
        const [promiseGetTokenViaPrompt, cancelGetTokenViaPrompt] = getTokenViaPrompt();
        const [promiseGetTokenViaServer, cancelGetTokenViaServer] = getTokenViaServer();
        await Promise.race([promiseGetTokenViaServer, promiseGetTokenViaPrompt]).finally(() => {
            cancelGetTokenViaServer();
            cancelGetTokenViaPrompt();
        });
        spinner.stop('Successfully received Amplify Studio tokens.');
    }
    catch (e) {
        spinner.stop();
        amplify_prompts_1.printer.error(`Failed to authenticate with Amplify Studio: ${(e === null || e === void 0 ? void 0 : e.message) || e}`);
    }
};
exports.adminLoginFlow = adminLoginFlow;
const closeReadline = (rl) => {
    rl.terminal = false;
    rl.close();
};
exports.closeReadline = closeReadline;
//# sourceMappingURL=admin-login.js.map