"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.viewSummaryTable = exports.viewEnvInfo = exports.viewResourceDiffs = void 0;
const resource_status_data_1 = require("./resource-status-data");
const resourceStatus = __importStar(require("./resource-status-diff"));
const get_env_info_1 = require("./get-env-info");
const print_1 = require("./print");
const chalk_1 = __importDefault(require("chalk"));
async function viewResourceDiffs({ resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeCreated }) {
    const resourceDiffs = await (0, resource_status_data_1.getResourceDiffs)(resourcesToBeUpdated, resourcesToBeDeleted, resourcesToBeCreated);
    for await (const resourceDiff of resourceDiffs.updatedDiff) {
        await resourceDiff.printResourceDetailStatus(resourceStatus.stackMutationType.UPDATE);
    }
    for await (const resourceDiff of resourceDiffs.deletedDiff) {
        await resourceDiff.printResourceDetailStatus(resourceStatus.stackMutationType.DELETE);
    }
    for await (const resourceDiff of resourceDiffs.createdDiff) {
        await resourceDiff.printResourceDetailStatus(resourceStatus.stackMutationType.CREATE);
    }
}
exports.viewResourceDiffs = viewResourceDiffs;
function viewEnvInfo() {
    const { envName } = (0, get_env_info_1.getEnvInfo)();
    print_1.print.info(`
    ${chalk_1.default.green('Current Environment')}: ${envName}
    `);
}
exports.viewEnvInfo = viewEnvInfo;
function viewSummaryTable(resourceStateData) {
    const tableOptions = (0, resource_status_data_1.getSummaryTableData)(resourceStateData);
    const { table } = print_1.print;
    table(tableOptions, { format: 'lean' });
}
exports.viewSummaryTable = viewSummaryTable;
//# sourceMappingURL=resource-status-view.js.map