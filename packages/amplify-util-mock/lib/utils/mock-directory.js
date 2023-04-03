"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockAPIResourceDirectory = exports.getMockSearchableResourceDirectory = exports.getMockOpensearchDataDirectory = exports.getMockSearchableTriggerDirectory = exports.getMockDataDirectory = void 0;
const path = __importStar(require("path"));
function getMockDataDirectory(context) {
    const { projectPath } = context.amplify.getEnvInfo();
    return path.join(projectPath, 'amplify', 'mock-data');
}
exports.getMockDataDirectory = getMockDataDirectory;
function getMockSearchableTriggerDirectory(context) {
    const mockSearchableResourceDirectory = getMockSearchableResourceDirectory(context);
    return path.join(mockSearchableResourceDirectory, 'searchable-lambda-trigger');
}
exports.getMockSearchableTriggerDirectory = getMockSearchableTriggerDirectory;
function getMockOpensearchDataDirectory(context) {
    const mockSearchableResourceDirectory = getMockSearchableResourceDirectory(context);
    return path.join(mockSearchableResourceDirectory, 'searchable-data');
}
exports.getMockOpensearchDataDirectory = getMockOpensearchDataDirectory;
function getMockSearchableResourceDirectory(context) {
    const mockAPIResourceDirectory = getMockAPIResourceDirectory(context);
    return path.join(mockAPIResourceDirectory, 'searchable');
}
exports.getMockSearchableResourceDirectory = getMockSearchableResourceDirectory;
function getMockAPIResourceDirectory(context) {
    const { projectPath } = context.amplify.getEnvInfo();
    return path.join(projectPath, 'amplify', 'mock-api-resources');
}
exports.getMockAPIResourceDirectory = getMockAPIResourceDirectory;
//# sourceMappingURL=mock-directory.js.map