"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HydrateTags = exports.validate = exports.ReadTags = void 0;
const jsonUtilities_1 = require("../jsonUtilities");
const lodash_1 = __importDefault(require("lodash"));
function ReadTags(tagsFilePath) {
    const tags = jsonUtilities_1.JSONUtilities.readJson(tagsFilePath, {
        throwIfNotExist: false,
        preserveComments: false,
    });
    if (!tags)
        return [];
    return tags;
}
exports.ReadTags = ReadTags;
function validate(tags, skipProjectEnv = false) {
    const allowedKeySet = new Set(['Key', 'Value']);
    lodash_1.default.each(tags, (tags) => {
        if (lodash_1.default.some(Object.keys(tags), (r) => !allowedKeySet.has(r)))
            throw new Error('Tag should be of type Key: string, Value: string');
    });
    if (lodash_1.default.uniq(tags.map((r) => r.Key)).length !== tags.length)
        throw new Error("'Key' should be unique");
    if (tags.length > 50)
        throw new Error('No. of tags cannot exceed 50');
    lodash_1.default.each(tags, (tag) => {
        const tagValidationRegExp = /[^a-z0-9_.:/=+@\- ]/gi;
        const tagValue = skipProjectEnv ? tag.Value.replace('{project-env}', '') : tag.Value;
        if (tagValidationRegExp.test(tagValue)) {
            throw new Error('Invalid character found in Tag Value. Tag values may only contain unicode letters, digits, whitespace, or one of these symbols: _ . : / = + - @');
        }
        if (tagValidationRegExp.test(tag.Key)) {
            throw new Error('Invalid character found in Tag Key. Tag Key may only contain unicode letters, digits, whitespace, or one of these symbols: _ . : / = + - @');
        }
        if (tag.Value.length > 256) {
            throw new Error(`Tag value can be up to 256 characters but found ${tag.Value.length}`);
        }
        if (tag.Key.length > 128) {
            throw new Error(`Tag key can be up to 128 characters but found ${tag.Key.length}`);
        }
    });
}
exports.validate = validate;
function HydrateTags(tags, tagVariables, skipProjectEnv = false) {
    const { envName, projectName } = tagVariables;
    const replace = {
        '{project-name}': projectName,
        '{project-env}': envName,
    };
    const regexMatcher = skipProjectEnv ? /{project-name}/g : /{project-name}|{project-env}/g;
    const hydratedTags = tags.map((tag) => {
        return {
            ...tag,
            Value: tag.Value.replace(regexMatcher, (matched) => replace[matched]),
        };
    });
    validate(hydratedTags, skipProjectEnv);
    return hydratedTags;
}
exports.HydrateTags = HydrateTags;
//# sourceMappingURL=Tags.js.map