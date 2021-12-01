"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCodegenErrors = exports.transformCodegenError = void 0;
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
const error_types_1 = require("./error-types");
const transformCodegenError = (error) => {
    if (error instanceof error_types_1.InternalError || error instanceof error_types_1.InvalidInputError) {
        return error;
    }
    let errorMsg = 'Unhandled Codegen Error Occurred';
    if (error.stack) {
        errorMsg += ` - ${JSON.stringify(error.stack)}`;
    }
    return new error_types_1.InternalError(errorMsg);
};
exports.transformCodegenError = transformCodegenError;
const handleCodegenErrors = (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value;
    // eslint-disable-next-line no-param-reassign, func-names
    descriptor.value = function (...args) {
        try {
            return originalMethod.apply(this, args);
        }
        catch (error) {
            throw (0, exports.transformCodegenError)(error);
        }
    };
    return descriptor;
};
exports.handleCodegenErrors = handleCodegenErrors;
//# sourceMappingURL=error-transformer.js.map