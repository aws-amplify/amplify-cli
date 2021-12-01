"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestInvalidInputError = void 0;
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
const errors_1 = require("../../errors");
class TestInvalidInputError extends errors_1.InvalidInputError {
}
exports.TestInvalidInputError = TestInvalidInputError;
describe('transformCodegenError', () => {
    it('transforms generic errors into Internal Error', () => {
        expect((0, errors_1.transformCodegenError)(new Error(''))).toBeInstanceOf(errors_1.InternalError);
    });
    it('passes through Internal Error', () => {
        expect((0, errors_1.transformCodegenError)(new errors_1.InternalError(''))).toBeInstanceOf(errors_1.InternalError);
    });
    it('passes up instance of Invalid Input Error', () => {
        expect((0, errors_1.transformCodegenError)(new TestInvalidInputError(''))).toBeInstanceOf(errors_1.InvalidInputError);
    });
});
describe('handleCodegenErrors', () => {
    // Type decorators complain in this context, wrapping in a class.
    class TestFns {
        functionWithoutError() {
            return 'DONE';
        }
        functionWithError() {
            throw new Error();
        }
    }
    __decorate([
        errors_1.handleCodegenErrors
    ], TestFns.prototype, "functionWithoutError", null);
    __decorate([
        errors_1.handleCodegenErrors
    ], TestFns.prototype, "functionWithError", null);
    const testFns = new TestFns();
    it('executes underlying method', () => {
        expect(testFns.functionWithoutError()).toEqual('DONE');
    });
    it('catches and transforms unknown errors into InternalError', () => {
        try {
            testFns.functionWithError();
        }
        catch (error) {
            if (error instanceof errors_1.InternalError) {
                return;
            }
        }
        throw new Error('Should have finished in caught');
    });
});
//# sourceMappingURL=error-transformer.test.js.map