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
const react_component_render_helper_1 = require("../react-component-render-helper");
const snapshot_helpers_1 = require("./__utils__/snapshot-helpers");
describe('react-component-render-helper', () => {
    test('getFixedComponentPropValueExpression', () => {
        const value = 'testValue';
        expect((0, react_component_render_helper_1.getFixedComponentPropValueExpression)({ value }).text).toEqual(value);
    });
    describe('getComponentPropName', () => {
        test('with name', () => {
            const name = 'ComponentName';
            expect((0, react_component_render_helper_1.getComponentPropName)(name)).toEqual(`${name}Props`);
        });
        test('without name', () => {
            expect((0, react_component_render_helper_1.getComponentPropName)()).toEqual(`ComponentWithoutNameProps`);
        });
    });
    describe('property type checkers', () => {
        const propertyTypes = {
            ConcatenatedFrontendManagerComponentProperty: { checker: react_component_render_helper_1.isConcatenatedProperty, property: { concat: [] } },
            ConditionalFrontendManagerComponentProperty: {
                checker: react_component_render_helper_1.isConditionalProperty,
                property: {
                    condition: {
                        property: 'user',
                        field: 'age',
                        operator: 'gt',
                        operand: '18',
                        then: {
                            value: 'Vote',
                        },
                        else: {
                            value: 'Sorry you cannot vote',
                        },
                    },
                },
            },
            FixedFrontendManagerComponentProperty: { checker: react_component_render_helper_1.isFixedPropertyWithValue, property: { value: 'testValue' } },
            BoundFrontendManagerComponentProperty: {
                checker: react_component_render_helper_1.isBoundProperty,
                property: { bindingProperties: { property: 'testBinding' } },
            },
            CollectionFrontendManagerComponentProperty: {
                checker: react_component_render_helper_1.isCollectionItemBoundProperty,
                property: { collectionBindingProperties: { property: 'testCollectionBinding' } },
            },
        };
        Object.keys(propertyTypes).forEach((propertyType) => {
            describe(propertyType, () => {
                const { [propertyType]: { checker, property }, ...otherProperties } = propertyTypes;
                test(`is ${propertyType}`, () => {
                    expect(checker(property)).toBeTruthy();
                });
                Object.entries(otherProperties).forEach(([otherPropertyType, { property }]) => {
                    test(`${otherPropertyType} is not ${propertyType}`, () => {
                        expect(checker(property)).toBeFalsy();
                    });
                });
            });
        });
    });
    describe('buildFixedJsxExpression', () => {
        test('string', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: 'some text' }));
        });
        test('number', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: 400 }));
        });
        test('string wrapped number', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: '400' }));
        });
        test('parsed number', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: '400', type: 'Number' }));
        });
        test('boolean', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: true }));
        });
        test('string wrapped boolean', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: 'true' }));
        });
        test('parsed boolean', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: 'true', type: 'Boolean' }));
        });
        test('string wrapped array', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: '[1,2,3]' }));
        });
        test('parsed array', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: '[1,2,3]', type: 'Object' }));
        });
        test('string wrapped object', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: '{"transponder": "rocinante"}' }));
        });
        test('parsed object', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: '{"transponder": "rocinante"}', type: 'Object' }));
        });
        test('string wrapped null', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: 'null' }));
        });
        test('parsed null', () => {
            (0, snapshot_helpers_1.assertASTMatchesSnapshot)((0, react_component_render_helper_1.buildFixedJsxExpression)({ value: 'null', type: 'Object' }));
        });
    });
});
//# sourceMappingURL=react-component-render-helper.test.js.map