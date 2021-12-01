"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const renderer_helper_1 = require("../renderer-helper");
describe('render-helper', () => {
    const bindingProperties = {
        data: {
            type: 'Data',
            bindingProperties: {
                model: 'User',
            },
        },
        auth: {
            type: 'Authentication',
            bindingProperties: {
                userAttribute: 'username',
            },
        },
        storage: {
            type: 'Storage',
            bindingProperties: {
                bucket: 'test-bucket',
            },
        },
        boolean: {
            type: 'Boolean',
        },
        string: {
            type: 'String',
        },
        number: {
            type: 'Number',
        },
        date: {
            type: 'Date',
        },
    };
    describe('isFrontendManagerComponentWithBinding', () => {
        test('object has bindingProperties', () => {
            expect((0, renderer_helper_1.isFrontendManagerComponentWithBinding)({
                componentType: 'View',
                name: 'MyBindingView',
                properties: {},
                bindingProperties: {},
            })).toBeTruthy();
            expect((0, renderer_helper_1.isFrontendManagerComponentWithBinding)({
                componentType: 'View',
                name: 'MyNonBindingView',
                properties: {},
            })).toBeFalsy();
        });
    });
    describe('isFrontendManagerComponentWithCollectionProperties', () => {
        test('object without collectionProperties is falsy', () => {
            expect((0, renderer_helper_1.isFrontendManagerComponentWithCollectionProperties)({
                componentType: '',
                name: '',
                properties: {},
            })).toBeFalsy();
        });
        test('object with undefined collectionProperties is falsy', () => {
            expect((0, renderer_helper_1.isFrontendManagerComponentWithCollectionProperties)({
                componentType: '',
                name: '',
                properties: {},
                collectionProperties: undefined,
            })).toBeFalsy();
        });
        test('object with collectionProperties is truthy', () => {
            expect((0, renderer_helper_1.isFrontendManagerComponentWithCollectionProperties)({
                componentType: '',
                name: '',
                properties: {},
                collectionProperties: {},
            })).toBeTruthy();
        });
    });
    describe('isFrontendManagerComponentWithVariants', () => {
        test('object without variants is falsy', () => {
            expect((0, renderer_helper_1.isFrontendManagerComponentWithVariants)({
                componentType: '',
                name: '',
                properties: {},
            })).toBeFalsy();
        });
        test('object with undefined variants is falsy', () => {
            expect((0, renderer_helper_1.isFrontendManagerComponentWithVariants)({
                componentType: '',
                name: '',
                properties: {},
                variants: undefined,
            })).toBeFalsy();
        });
        test('object with empty list of variants is falsy', () => {
            expect((0, renderer_helper_1.isFrontendManagerComponentWithVariants)({
                componentType: '',
                name: '',
                properties: {},
                variants: [],
            })).toBeFalsy();
        });
        test('object with variants is truthy', () => {
            expect((0, renderer_helper_1.isFrontendManagerComponentWithVariants)({
                componentType: '',
                name: '',
                properties: {},
                variants: [
                    {
                        variantValues: {},
                        overrides: {},
                    },
                ],
            })).toBeTruthy();
        });
    });
    describe('isDataPropertyBinding', () => {
        test('property has type Data', () => {
            expect((0, renderer_helper_1.isDataPropertyBinding)(bindingProperties.data)).toBeTruthy();
            const { data, ...otherTypes } = bindingProperties;
            Object.values(otherTypes).forEach((otherType) => expect((0, renderer_helper_1.isDataPropertyBinding)(otherType)).toBeFalsy());
        });
    });
    describe('isAuthPropertyBinding', () => {
        test('property has type Authentication', () => {
            expect((0, renderer_helper_1.isAuthPropertyBinding)(bindingProperties.auth)).toBeTruthy();
            const { auth, ...otherTypes } = bindingProperties;
            Object.values(otherTypes).forEach((otherType) => expect((0, renderer_helper_1.isAuthPropertyBinding)(otherType)).toBeFalsy());
        });
    });
    describe('isStoragePropertyBinding', () => {
        test('property has type Storage', () => {
            expect((0, renderer_helper_1.isStoragePropertyBinding)(bindingProperties.storage)).toBeTruthy();
            const { storage, ...otherTypes } = bindingProperties;
            Object.values(otherTypes).forEach((otherType) => expect((0, renderer_helper_1.isStoragePropertyBinding)(otherType)).toBeFalsy());
        });
    });
    describe('isSimplePropertyBinding', () => {
        test('property has type Boolean, String, Number, or Date', () => {
            expect((0, renderer_helper_1.isSimplePropertyBinding)(bindingProperties.boolean)).toBeTruthy();
            expect((0, renderer_helper_1.isSimplePropertyBinding)(bindingProperties.string)).toBeTruthy();
            expect((0, renderer_helper_1.isSimplePropertyBinding)(bindingProperties.number)).toBeTruthy();
            expect((0, renderer_helper_1.isSimplePropertyBinding)(bindingProperties.date)).toBeTruthy();
            const { boolean, string, number, date, ...otherTypes } = bindingProperties;
            Object.values(otherTypes).forEach((otherType) => expect((0, renderer_helper_1.isSimplePropertyBinding)(otherType)).toBeFalsy());
        });
    });
});
//# sourceMappingURL=renderer-helper.test.js.map