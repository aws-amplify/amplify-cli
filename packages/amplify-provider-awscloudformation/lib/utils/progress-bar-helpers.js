"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProgressBarFormatter = exports.createItemFormatter = exports.CNF_ERROR_STATUS = exports.CFN_SUCCESS_STATUS = void 0;
const columnify_1 = __importDefault(require("columnify"));
const COLUMNIFY_WIDTH = 30;
exports.CFN_SUCCESS_STATUS = [
    'UPDATE_COMPLETE',
    'CREATE_COMPLETE',
    'DELETE_COMPLETE',
    'DELETE_SKIPPED',
    'UPDATE_ROLLBACK_COMPLETE',
    'ROLLBACK_COMPLETE',
];
exports.CNF_ERROR_STATUS = ['CREATE_FAILED', 'DELETE_FAILED', 'UPDATE_FAILED', 'UPDATE_ROLLBACK_FAILED', 'ROLLBACK_FAILED'];
const createItemFormatter = (payload) => {
    let color = '';
    const lowercasePayload = [
        {
            logicalResourceId: payload.LogicalResourceId,
            resourceType: payload.ResourceType,
            resourceStatus: payload.ResourceStatus,
            timeStamp: new Date(payload.Timestamp).toString(),
        },
    ];
    const renderString = (0, columnify_1.default)(lowercasePayload, {
        showHeaders: false,
        truncate: true,
        maxWidth: COLUMNIFY_WIDTH,
        minWidth: COLUMNIFY_WIDTH,
    });
    if (exports.CFN_SUCCESS_STATUS.includes(payload.ResourceStatus)) {
        color = 'green';
    }
    if (exports.CNF_ERROR_STATUS.includes(payload.ResourceStatus)) {
        color = 'red';
    }
    return { renderString, color };
};
exports.createItemFormatter = createItemFormatter;
const createProgressBarFormatter = (payload, value, total) => {
    let statusString = 'Deploying';
    const progressNameParts = payload.progressName.split('-');
    const name = progressNameParts.length === 1 ? progressNameParts[0] : `${progressNameParts[0]} ${progressNameParts[1]}`;
    if (total === value) {
        statusString = 'Deployed';
    }
    return `${statusString} ${name}`;
};
exports.createProgressBarFormatter = createProgressBarFormatter;
//# sourceMappingURL=progress-bar-helpers.js.map