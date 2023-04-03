var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const NodeEnvironment = require('jest-environment-node');
class CLIEnvironment extends NodeEnvironment {
    constructor(config, context) {
        super(config, context);
        this.testPath = context.testPath;
        this.testLogStack = [];
        this.describeBlocks = [];
        this.testName = '';
        this.hook = '';
        this.cliExecutionLogs = {
            path: this.testPath,
            children: [],
            logs: [],
        };
        this.results = [];
        this.currentBlock = this.cliExecutionLogs;
    }
    setup() {
        const _super = Object.create(null, {
            setup: { get: () => super.setup }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.setup.call(this);
            this.global.storeCLIExecutionLog = (result) => {
                this.currentBlock.logs.push(result);
            };
            // Helper function used for tagging the test name in resource
            this.global.getTestName = () => {
                return this.testName;
            };
            this.global.getDescibeBlocks = () => {
                return this.describeBlocks.filter((b) => b !== 'ROOT_DESCRIBE_BLOCK');
            };
            this.global.getHookName = () => {
                return this.hook;
            };
        });
    }
    teardown() {
        const _super = Object.create(null, {
            teardown: { get: () => super.teardown }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (this.context.global.addCLITestRunnerLogs) {
                const result = this.cliExecutionLogs.children.find((log) => log.type === 'describe' && log.name === 'ROOT_DESCRIBE_BLOCK');
                if (result) {
                    this.context.global.addCLITestRunnerLogs(result);
                }
            }
            yield _super.teardown.call(this);
        });
    }
    runScript(script) {
        return super.runScript(script);
    }
    handleTestEvent(event) {
        let hookName;
        let currentBlock;
        switch (event.name) {
            case 'hook_start':
                hookName = event.hook.type;
                currentBlock = {
                    name: hookName,
                    logs: [],
                };
                this.testLogStack.push(this.currentBlock);
                this.currentBlock.hooks[hookName] = [...(this.currentBlock.hooks[hookName] || []), currentBlock];
                this.currentBlock = currentBlock;
                this.hook = currentBlock.name;
                break;
            case 'test_start':
                currentBlock = {
                    type: 'test',
                    name: event.test.name,
                    hooks: {},
                    logs: [],
                    children: [],
                };
                this.testName = currentBlock.name;
                this.testLogStack.push(this.currentBlock);
                this.currentBlock.children.push(currentBlock);
                this.currentBlock = currentBlock;
                break;
            case 'run_describe_start':
                currentBlock = {
                    type: 'describe',
                    name: event.describeBlock.name,
                    hooks: {},
                    logs: [],
                    children: [],
                };
                this.describeBlocks.push(currentBlock.name);
                this.testLogStack.push(this.currentBlock);
                this.currentBlock.children.push(currentBlock);
                this.currentBlock = currentBlock;
                break;
            case 'hook_success':
            case 'hook_failure':
                this.currentBlock = this.testLogStack.pop();
                this.hook = '';
                break;
            case 'test_done':
                this.testName = '';
                this.currentBlock = this.testLogStack.pop();
                break;
            case 'run_describe_finish':
                this.describeBlocks.pop();
                this.currentBlock = this.testLogStack.pop();
                break;
        }
    }
}
module.exports = CLIEnvironment;
//# sourceMappingURL=cli-test-environment.js.map