const NodeEnvironment = require('jest-environment-node');

class CLIEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
    this.testPath = context.testPath;
    this.testLogStack = [];
    this.cliExecutionLogs = {
      path: this.testPath,
      children: [],
      logs: [],
    };
    this.results = [];
    this.currentBlock = this.cliExecutionLogs;
  }

  async setup() {
    await super.setup();
    this.global.storeCLIExecutionLog = result => {
      this.currentBlock.logs.push(result);
    };
  }

  async teardown() {
    if (this.context.global.addCLITestRunnerLogs) {
      const result = this.cliExecutionLogs.children.find(log => log.type === 'describe' && log.name === 'ROOT_DESCRIBE_BLOCK');
      if (result) {
        this.context.global.addCLITestRunnerLogs(result);
      }
    }
    await super.teardown();
  }

  runScript(script) {
    return super.runScript(script);
  }

  handleTestEvent(event, state) {
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
        break;
      case 'test_start':
        currentBlock = {
          type: 'test',
          name: event.test.name,
          hooks: {},
          logs: [],
          children: [],
        };
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
        this.testLogStack.push(this.currentBlock);
        this.currentBlock.children.push(currentBlock);
        this.currentBlock = currentBlock;
        break;
      case 'hook_success':
      case 'hook_failure':
      case 'test_done':
      case 'run_describe_finish':
        this.currentBlock = this.testLogStack.pop();
        break;
    }
  }
}

module.exports = CLIEnvironment;
