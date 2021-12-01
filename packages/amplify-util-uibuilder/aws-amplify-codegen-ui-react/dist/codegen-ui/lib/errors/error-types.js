"use strict";
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
/* eslint-disable max-classes-per-file */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidInputError = exports.InternalError = void 0;
/**
 * Internal error to the codegen library.
 * Something went wrong that we didn't expect while executing code generation for input that
 * passed input verification.
 */
class InternalError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, InternalError.prototype);
    }
}
exports.InternalError = InternalError;
/**
 * Unexpected input was provided to the codegen library, and we don't expect retrying will help in resolving.
 */
class InvalidInputError extends Error {
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, InvalidInputError.prototype);
    }
}
exports.InvalidInputError = InvalidInputError;
//# sourceMappingURL=error-types.js.map