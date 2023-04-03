"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HooksMeta = void 0;
const hooksConstants_1 = require("./hooksConstants");
const state_manager_1 = require("../state-manager");
const lodash_1 = __importDefault(require("lodash"));
class HooksMeta {
    constructor() {
        this.hookEvent = {};
        this.dataParameter = { amplify: {} };
    }
    getDataParameter() {
        return this.dataParameter;
    }
    getErrorParameter() {
        return this.errorParameter;
    }
    getHookEvent() {
        return this.hookEvent;
    }
    setEnvironmentName(envName) {
        this.dataParameter.amplify.environment = envName;
    }
    setAmplifyVersion(amplifyVersion) {
        this.dataParameter.amplify.version = amplifyVersion;
    }
    setErrorParameter(errorParameter) {
        this.errorParameter = errorParameter;
    }
    setEventCommand(command) {
        this.hookEvent.command = command;
    }
    setEventSubCommand(subCommand) {
        this.hookEvent.subCommand = subCommand;
    }
    setEventPrefix(prefix) {
        this.hookEvent.eventPrefix = prefix;
    }
    mergeDataParameter(newDataParameter) {
        this.dataParameter = lodash_1.default.merge(this.dataParameter, newDataParameter);
    }
    setHookEventFromInput(input) {
        var _a, _b, _c, _d;
        if (!input) {
            return;
        }
        if (this.hookEvent.command) {
            return;
        }
        let command = (_a = input.command) !== null && _a !== void 0 ? _a : '';
        let subCommand = (_b = input.plugin) !== null && _b !== void 0 ? _b : '';
        switch (command) {
            case 'env':
                subCommand = 'env';
                if (!input.subCommands || input.subCommands.length < 0 || !hooksConstants_1.supportedEnvEvents.includes(input.subCommands[0])) {
                    return;
                }
                command = input.subCommands[0];
                break;
            case 'configure':
                if (input.plugin === 'notifications' || input.plugin === 'hosting') {
                    command = 'update';
                }
                break;
            case 'gql-compile':
                command = 'gqlcompile';
                break;
            case 'add-graphql-datasource':
                command = 'addgraphqldatasource';
                break;
        }
        if (subCommand === 'mock') {
            subCommand = command;
            command = 'mock';
        }
        if (Object.prototype.hasOwnProperty.call(hooksConstants_1.supportedEvents, command)) {
            this.hookEvent.command = command;
            if ((_c = hooksConstants_1.supportedEvents === null || hooksConstants_1.supportedEvents === void 0 ? void 0 : hooksConstants_1.supportedEvents[command]) === null || _c === void 0 ? void 0 : _c.includes(subCommand)) {
                this.hookEvent.subCommand = subCommand;
            }
        }
        this.hookEvent.forcePush = (((_d = input === null || input === void 0 ? void 0 : input.options) === null || _d === void 0 ? void 0 : _d.forcePush) && this.hookEvent.command !== 'push') || false;
        this.hookEvent.argv = input.argv;
    }
}
exports.HooksMeta = HooksMeta;
HooksMeta.getInstance = (input, eventPrefix, errorParameter) => {
    if (!HooksMeta.instance) {
        HooksMeta.instance = new HooksMeta();
    }
    if (input) {
        HooksMeta.instance.setHookEventFromInput(input);
    }
    HooksMeta.instance.setEventPrefix(eventPrefix);
    if (state_manager_1.stateManager.localEnvInfoExists()) {
        HooksMeta.instance.setEnvironmentName(state_manager_1.stateManager.getLocalEnvInfo());
    }
    HooksMeta.instance.mergeDataParameter({
        amplify: {
            command: HooksMeta.instance.getHookEvent().command,
            subCommand: HooksMeta.instance.getHookEvent().subCommand,
            argv: HooksMeta.instance.getHookEvent().argv,
        },
    });
    HooksMeta.instance.setErrorParameter(errorParameter);
    return HooksMeta.instance;
};
HooksMeta.releaseInstance = () => {
    HooksMeta.instance = undefined;
};
//# sourceMappingURL=hooksMeta.js.map