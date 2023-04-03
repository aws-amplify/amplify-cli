"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLINoFlowReport = void 0;
class CLINoFlowReport {
    constructor() {
        this.pushInteractiveFlow = (_) => _;
        this.getFlowReport = () => ({});
        this.assignProjectIdentifier = () => undefined;
        this.setIsHeadless = (_) => _;
        this.pushHeadlessFlow = (_) => _;
    }
    static get instance() {
        if (!CLINoFlowReport._instance) {
            CLINoFlowReport._instance = new CLINoFlowReport();
        }
        return CLINoFlowReport._instance;
    }
}
exports.CLINoFlowReport = CLINoFlowReport;
CLINoFlowReport._instance = new CLINoFlowReport();
//# sourceMappingURL=NoFlowReport.js.map