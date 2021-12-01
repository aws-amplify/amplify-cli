"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const validation_helper_1 = require("../validation-helper");
describe('validation-helper', () => {
    describe('validateComponentSchema', () => {
        test('throws no error on valid type', () => {
            (0, validation_helper_1.validateComponentSchema)({
                name: 'MyBindingView',
                componentType: 'View',
                properties: {},
            });
        });
        test('top-level component requires componentType', () => {
            expect(() => {
                (0, validation_helper_1.validateComponentSchema)({
                    name: 'MyBindingView',
                    properties: {},
                });
            }).toThrowErrorMatchingSnapshot();
        });
        test('values can be `null` or not present', () => {
            (0, validation_helper_1.validateComponentSchema)({
                name: 'MyBindingView',
                componentType: 'View',
                properties: {},
                sourceId: null,
            });
        });
        test('top-level component requires properties', () => {
            expect(() => {
                (0, validation_helper_1.validateComponentSchema)({
                    componentType: 'View',
                    name: 'MyBindingView',
                });
            }).toThrowErrorMatchingSnapshot();
        });
        test('top-level component requires componentType to be the correct type', () => {
            expect(() => {
                (0, validation_helper_1.validateComponentSchema)({
                    componentType: 2,
                    name: 'MyBindingView',
                    properties: {},
                });
            }).toThrowErrorMatchingSnapshot();
        });
        test('child component requires componentType to be the correct type', () => {
            expect(() => {
                (0, validation_helper_1.validateComponentSchema)({
                    componentType: 'View',
                    name: 'MyBindingView',
                    properties: {},
                    children: [
                        {
                            componentType: 3,
                            properties: {},
                        },
                    ],
                });
            }).toThrowErrorMatchingSnapshot();
        });
        test('deeply nested child components requires properties', () => {
            expect(() => {
                (0, validation_helper_1.validateComponentSchema)({
                    componentType: 'View',
                    name: 'MyBindingView',
                    properties: {},
                    children: [
                        {
                            componentType: 'View',
                            properties: {},
                            children: [
                                {
                                    componentType: 'View',
                                    properties: {},
                                    children: [
                                        {
                                            componentType: 'Button',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                });
            }).toThrowErrorMatchingSnapshot();
        });
        test('fails on componentType with whitespace', () => {
            expect(() => {
                (0, validation_helper_1.validateComponentSchema)({
                    name: 'CustomComponent',
                    componentType: 'View 2',
                    properties: {},
                });
            }).toThrowErrorMatchingSnapshot();
        });
        test('fails on componentType with leading number', () => {
            expect(() => {
                (0, validation_helper_1.validateComponentSchema)({
                    name: 'CustomComponent',
                    componentType: '2View',
                    properties: {},
                });
            }).toThrowErrorMatchingSnapshot();
        });
        test('succeeds on componentType with trailing number', () => {
            (0, validation_helper_1.validateComponentSchema)({
                name: 'CustomComponent',
                componentType: 'View2',
                properties: {},
            });
        });
        test('child component name may contain whitespace', () => {
            (0, validation_helper_1.validateComponentSchema)({
                name: 'CustomComponent',
                componentType: 'View',
                properties: {},
                children: [
                    {
                        name: 'I Have Spaces',
                        componentType: 'Button',
                        properties: {},
                    },
                ],
            });
        });
    });
    describe('validateThemeSchema', () => {
        test('throws no error on valid type', () => {
            (0, validation_helper_1.validateThemeSchema)({
                name: 'MyBindingView',
                values: [
                    {
                        key: 'breakpoints',
                        value: {},
                    },
                    {
                        key: 'tokens',
                        value: {},
                    },
                ],
                overrides: [],
            });
        });
        test('top-level component requires name', () => {
            expect(() => {
                (0, validation_helper_1.validateThemeSchema)({
                    values: [
                        {
                            key: 'breakpoints',
                            value: {},
                        },
                        {
                            key: 'tokens',
                            value: {},
                        },
                    ],
                    overrides: [],
                });
            }).toThrowErrorMatchingSnapshot();
        });
        test('top-level component requires values', () => {
            expect(() => {
                (0, validation_helper_1.validateThemeSchema)({
                    name: 'MyBindingView',
                    overrides: [],
                });
            }).toThrowErrorMatchingSnapshot();
        });
        test('children objects should not be empty', () => {
            expect(() => {
                (0, validation_helper_1.validateThemeSchema)({
                    name: 'MyBindingView',
                    values: [
                        {
                            key: 'breakpoints',
                            value: {},
                        },
                        {},
                    ],
                    overrides: [],
                });
            }).toThrowErrorMatchingSnapshot();
        });
        test('overrides should contain the right shape', () => {
            expect(() => {
                (0, validation_helper_1.validateThemeSchema)({
                    name: 'MyBindingView',
                    values: [],
                    overrides: [
                        {
                            value: {},
                        },
                    ],
                });
            }).toThrowErrorMatchingSnapshot();
        });
    });
});
//# sourceMappingURL=validation-helper.test.js.map