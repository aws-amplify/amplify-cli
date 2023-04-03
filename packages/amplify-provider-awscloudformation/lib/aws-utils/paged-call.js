"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagedAWSCall = void 0;
const assert_1 = __importDefault(require("assert"));
const pagedAWSCall = async (action, params, accessor, getNextToken) => {
    (0, assert_1.default)(action, 'missing argument: action');
    (0, assert_1.default)(accessor, 'missing argument: accessor');
    (0, assert_1.default)(getNextToken, 'missing argument: getNextToken');
    let result = [];
    let response;
    let nextToken = undefined;
    do {
        response = await action(params, nextToken);
        if (response && accessor(response)) {
            result = result.concat(accessor(response));
        }
        nextToken = response ? await getNextToken(response, result) : undefined;
    } while (nextToken);
    return result;
};
exports.pagedAWSCall = pagedAWSCall;
//# sourceMappingURL=paged-call.js.map