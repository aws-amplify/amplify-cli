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
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateThemeSchema = exports.validateComponentSchema = void 0;
/*
  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

  Licensed under the Apache License, Version 2.0 (the "License").
  You may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
 */
const yup = __importStar(require("yup"));
const errors_1 = require("./errors");
const alphaNumString = () => {
    return yup.string().matches(/^[a-zA-Z0-9]*$/, { message: 'Expected an alphanumeric string' });
};
const alphaNumNoLeadingNumberString = () => {
    return yup
        .string()
        .matches(/^[a-zA-Z][a-zA-Z0-9]*$/, { message: 'Expected an alphanumeric string, starting with a character' });
};
/**
 * Component Schema Definitions
 */
const frontendManagerComponentChildSchema = yup.object({
    componentType: alphaNumNoLeadingNumberString().required(),
    // TODO: Name is required in the types file, but doesn't seem to need to be. Relaxing the restriction here.
    name: yup.string().nullable(),
    properties: yup.object().required(),
    // Doing lazy eval here since we reference our own type otherwise
    children: yup.lazy(() => yup.array(frontendManagerComponentChildSchema.default(undefined))),
    figmaMetadata: yup.object().nullable(),
    variants: yup.array().nullable(),
    overrides: yup.object().nullable(),
    bindingProperties: yup.object().nullable(),
    collectionProperties: yup.object().nullable(),
    actions: yup.object().nullable(),
});
const frontendManagerComponentSchema = yup.object({
    name: alphaNumString().nullable(),
    id: yup.string().nullable(),
    sourceId: yup.string().nullable(),
    componentType: alphaNumNoLeadingNumberString().required(),
    properties: yup.object().required(),
    children: yup.array(frontendManagerComponentChildSchema).nullable(),
    figmaMetadata: yup.object().nullable(),
    variants: yup.array().nullable(),
    overrides: yup.object().nullable(),
    bindingProperties: yup.object().nullable(),
    collectionProperties: yup.object().nullable(),
    actions: yup.object().nullable(),
});
/**
 * Theme Schema Definitions
 */
const frontendManagerThemeValuesSchema = yup.object({
    key: yup.string().required(),
    value: yup
        .object({
        value: yup.string(),
        children: yup.lazy(() => yup.array(frontendManagerThemeValuesSchema.default(undefined))),
    })
        .required(),
});
const frontendManagerThemeSchema = yup.object({
    name: alphaNumString().required(),
    id: yup.string().nullable(),
    values: yup.array(frontendManagerThemeValuesSchema).required(),
    overrides: yup.array(frontendManagerThemeValuesSchema).nullable(),
});
/**
 * FrontendManager Schema Validation Functions and Helpers.
 */
const validateSchema = (validator, frontendManagerSchema) => {
    try {
        validator.validateSync(frontendManagerSchema, { strict: true, abortEarly: false });
    }
    catch (e) {
        if (e instanceof yup.ValidationError) {
            throw new errors_1.InvalidInputError(e.errors.join(', '));
        }
        throw e;
    }
};
const validateComponentSchema = (schema) => validateSchema(frontendManagerComponentSchema, schema);
exports.validateComponentSchema = validateComponentSchema;
const validateThemeSchema = (schema) => validateSchema(frontendManagerThemeSchema, schema);
exports.validateThemeSchema = validateThemeSchema;
//# sourceMappingURL=validation-helper.js.map