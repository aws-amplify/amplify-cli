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
exports.crudFlow = void 0;
const inquirer = __importStar(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const crudFlow = async (role, permissionMap = {}, defaults = []) => {
    if (!role)
        throw new Error('No role provided to permission question flow');
    const possibleOperations = Object.keys(permissionMap).map((el) => ({ name: el, value: el }));
    const answers = await inquirer.prompt({
        name: 'permissions',
        type: 'checkbox',
        message: `What kind of access do you want for ${role} users?`,
        choices: possibleOperations,
        default: defaults,
        validate: (inputs) => {
            if (inputs.length === 0) {
                return 'Select at least one option';
            }
            return true;
        },
    });
    return lodash_1.default.uniq(lodash_1.default.flatten(answers.permissions.map((e) => permissionMap[e])));
};
exports.crudFlow = crudFlow;
//# sourceMappingURL=permission-flow.js.map