export = CLIEnvironment;
declare class CLIEnvironment extends NodeEnvironment {
    constructor(config: any, context: any);
    testPath: any;
    testLogStack: any[];
    describeBlocks: any[];
    testName: string;
    hook: string;
    cliExecutionLogs: {
        path: any;
        children: any[];
        logs: any[];
    };
    results: any[];
    currentBlock: {
        path: any;
        children: any[];
        logs: any[];
    };
    runScript(script: any): unknown;
    handleTestEvent(event: any): void;
}
import NodeEnvironment = require("jest-environment-node");
