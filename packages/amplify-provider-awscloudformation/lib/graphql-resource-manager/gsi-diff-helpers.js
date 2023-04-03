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
exports.isIndexModified = exports.generateGSIChangeList = exports.getGSIDiffs = exports.GSIChange = void 0;
const _ = __importStar(require("lodash"));
const cloudform_1 = require("cloudform");
const deep_diff_1 = require("deep-diff");
var GSIChange;
(function (GSIChange) {
    GSIChange["Add"] = "ADD";
    GSIChange["Update"] = "UPDATE";
    GSIChange["Delete"] = "DELETE";
})(GSIChange = exports.GSIChange || (exports.GSIChange = {}));
const getGSIDiffs = (current, next) => {
    var _a, _b;
    if (current.Properties.GlobalSecondaryIndexes instanceof cloudform_1.IntrinsicFunction ||
        next.Properties.GlobalSecondaryIndexes instanceof cloudform_1.IntrinsicFunction) {
        return [];
    }
    const currentIndexes = (_a = current.Properties.GlobalSecondaryIndexes) !== null && _a !== void 0 ? _a : [];
    const nextIndexes = (_b = next.Properties.GlobalSecondaryIndexes) !== null && _b !== void 0 ? _b : [];
    return (0, exports.generateGSIChangeList)(currentIndexes, nextIndexes);
};
exports.getGSIDiffs = getGSIDiffs;
const generateGSIChangeList = (currentIndexes, nextIndexes) => {
    const currentIndexByIndexName = _.keyBy(currentIndexes, 'IndexName');
    const currentIndexNames = Object.keys(currentIndexByIndexName);
    const nextIndexByIndexName = _.keyBy(nextIndexes, 'IndexName');
    const nextIndexNames = Object.keys(nextIndexByIndexName);
    const addedOrRemovedIndexNames = _.xor(currentIndexNames, nextIndexNames);
    const [indexToRemove, indexToAdd] = _.partition(addedOrRemovedIndexNames, (indexName) => currentIndexNames.includes(indexName));
    const possiblyModifiedIndexNames = _.xor([...currentIndexNames, ...nextIndexNames], addedOrRemovedIndexNames);
    const modifiedIndexes = possiblyModifiedIndexNames
        .filter((indexName) => (0, exports.isIndexModified)(currentIndexByIndexName[indexName], nextIndexByIndexName[indexName]))
        .map((indexName) => ({
        type: GSIChange.Update,
        indexName,
    }));
    return [
        ...indexToRemove.map((idx) => ({
            type: GSIChange.Delete,
            indexName: idx,
        })),
        ...indexToAdd.map((idx) => ({
            type: GSIChange.Add,
            indexName: idx,
        })),
        ...modifiedIndexes,
    ];
};
exports.generateGSIChangeList = generateGSIChangeList;
const isIndexModified = (currentIndex, nextIndex) => {
    const diffs = (0, deep_diff_1.diff)(currentIndex, nextIndex);
    if (currentIndex.IndexName instanceof cloudform_1.IntrinsicFunction) {
        return undefined;
    }
    return diffs === null || diffs === void 0 ? void 0 : diffs.some((diff) => {
        var _a;
        const leaf = (_a = diff.path) === null || _a === void 0 ? void 0 : _a.slice(-1)[0];
        return [
            'IndexName',
            'KeySchema',
            'AttributeName',
            'AttributeType',
            'KeyType',
            'NonKeyAttributes',
            'Projection',
            'ProjectionType',
        ].includes(leaf);
    });
};
exports.isIndexModified = isIndexModified;
//# sourceMappingURL=gsi-diff-helpers.js.map