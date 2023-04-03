export = AmplifyCLIExecutionReporter;
declare class AmplifyCLIExecutionReporter {
    constructor(globalConfig: any, options: any);
    _globalConfig: any;
    _options: any;
    onRunComplete(contexts: any, results: any): void;
}
