"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BannerMessage = exports.AWS_AMPLIFY_DEFAULT_BANNER_URL = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const semver_1 = __importDefault(require("semver"));
const proxy_agent_1 = __importDefault(require("proxy-agent"));
const logger_1 = require("../logger");
exports.AWS_AMPLIFY_DEFAULT_BANNER_URL = 'https://aws-amplify.github.io/amplify-cli/banner-message.json';
const MAX_SUPPORTED_MESSAGE_CONFIG_VERSION = '1.0.0';
const logger = (0, logger_1.getLogger)('amplify-cli-core', 'banner-message/index.ts');
class BannerMessage {
    constructor(cliVersion) {
        this.cliVersion = cliVersion;
        this.messages = [];
        this.fetchMessages = async (url) => {
            var _b;
            try {
                logger.info(`fetch banner messages from ${url}`);
                const proxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
                const fetchOptions = proxy ? { agent: new proxy_agent_1.default(proxy) } : {};
                const result = await (0, node_fetch_1.default)(url, fetchOptions);
                const body = await result.json();
                if (!semver_1.default.satisfies(body.version, MAX_SUPPORTED_MESSAGE_CONFIG_VERSION)) {
                    return;
                }
                this.messages = (_b = body.messages) !== null && _b !== void 0 ? _b : [];
            }
            catch (e) {
                logger.error('fetch banner message failed', e);
            }
        };
        this.getMessages = async (messageId) => {
            var _b;
            if (!this.messages.length) {
                await this.fetchMessages((_b = process.env.AMPLIFY_CLI_BANNER_MESSAGE_URL) !== null && _b !== void 0 ? _b : exports.AWS_AMPLIFY_DEFAULT_BANNER_URL);
            }
            const matchingMessageItems = this.messages.filter((m) => {
                var _b, _c;
                return m.id === messageId &&
                    ((_b = m.conditions) === null || _b === void 0 ? void 0 : _b.enabled) !== false &&
                    (((_c = m.conditions) === null || _c === void 0 ? void 0 : _c.cliVersions) ? semver_1.default.satisfies(this.cliVersion, m.conditions.cliVersions) : true);
            });
            const messageItem = matchingMessageItems.find((m) => {
                var _b, _c, _d, _e;
                if (m.conditions) {
                    const currentTime = Date.now();
                    const startTime = ((_b = m.conditions) === null || _b === void 0 ? void 0 : _b.startTime) ? Date.parse((_c = m.conditions) === null || _c === void 0 ? void 0 : _c.startTime) : currentTime;
                    const endTime = ((_d = m.conditions) === null || _d === void 0 ? void 0 : _d.endTime) ? Date.parse((_e = m.conditions) === null || _e === void 0 ? void 0 : _e.endTime) : currentTime;
                    return currentTime >= startTime && currentTime <= endTime;
                }
                return true;
            });
            return messageItem === null || messageItem === void 0 ? void 0 : messageItem.message;
        };
    }
}
exports.BannerMessage = BannerMessage;
_a = BannerMessage;
BannerMessage.initialize = (cliVersion) => {
    if (!BannerMessage.instance) {
        BannerMessage.instance = new BannerMessage(cliVersion);
    }
    return BannerMessage.instance;
};
BannerMessage.ensureInitialized = () => {
    if (!BannerMessage.instance) {
        throw new Error('BannerMessage is not initialized');
    }
};
BannerMessage.getMessage = async (messageId) => {
    BannerMessage.ensureInitialized();
    return BannerMessage.instance.getMessages(messageId);
};
BannerMessage.releaseInstance = () => {
    BannerMessage.instance = undefined;
};
//# sourceMappingURL=index.js.map