"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../..");
const type_definition_1 = require("../../type-definition");
const velocity_1 = require("../../velocity");
const array_1 = require("../../velocity/value-mapper/array");
const map_1 = require("../../velocity/value-mapper/map");
const general_utils_test_1 = require("./util/general-utils.test");
describe('VelocityTemplate', () => {
    let content;
    let simulator;
    beforeAll(() => {
        content = `"$ctx.error.message, $ctx.error.type"`;
        simulator = new __1.AmplifyAppSyncSimulator();
    });
    describe('constructor', () => {
        it('should handle bad template', () => {
            expect(() => new velocity_1.VelocityTemplate({
                path: 'INLINE_TEMPLATE',
                content: `{
          "version": "2017-02-28",
          "payload": {
            "identity": $util.toJson($$context.identity)
          }
        }`,
            }, simulator)).toThrowError('Error:Parse error on INLINE_TEMPLATE:3: \n' +
                'Lexical error on line 4. Unrecognized text.\n' +
                '...tity": $util.toJson($$context.identity)\n' +
                '-----------------------^');
        });
    });
    describe('#render', () => {
        describe('#render', () => {
            it('should handle unknow errors', () => {
                const template = new velocity_1.VelocityTemplate({
                    path: 'INLINE_TEMPLATE',
                    content,
                }, simulator);
                const info = general_utils_test_1.mockInfo;
                const result = template.render({
                    error: new Error('some unexpected error'),
                    arguments: {},
                    source: {},
                }, {
                    headers: { Key: 'value' },
                    requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
                }, info);
                expect(result.errors).toEqual([]);
                expect(result.result).toEqual('some unexpected error, UnknownErrorType');
            });
        });
        describe('#render', () => {
            it('should handle with a not error in error', () => {
                const template = new velocity_1.VelocityTemplate({
                    path: 'INLINE_TEMPLATE',
                    content,
                }, simulator);
                const info = general_utils_test_1.mockInfo;
                const result = template.render({
                    error: 'my string as error',
                    arguments: {},
                    source: {},
                }, {
                    headers: { Key: 'value' },
                    requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
                }, info);
                expect(result.errors).toEqual([]);
                expect(result.result).toEqual('Error: my string as error, UnknownErrorType');
            });
        });
        it('should handle string comparison', () => {
            const template = new velocity_1.VelocityTemplate({
                path: 'INLINE_TEMPLATE',
                content: `
#if( $ctx.stash.get("current_user_id")!=$ctx.prev.result.current_user_id)
"not the same value"
#else
"the same value"
#end`,
            }, simulator);
            const info = general_utils_test_1.mockInfo;
            const result = template.render({
                arguments: {},
                source: {},
                stash: {
                    current_user_id: 'someString',
                },
                prevResult: {
                    current_user_id: 'someString',
                },
            }, {
                headers: { Key: 'value' },
                requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
            }, info);
            expect(result.errors).toEqual([]);
            expect(result.result).toEqual('the same value');
        });
    });
    describe('buildRenderContext', () => {
        it('should generate a context ', () => {
            const template = new velocity_1.VelocityTemplate({
                path: 'INLINE_TEMPLATE',
                content: '$util.toJson("hello world")',
            }, simulator);
            const info = {
                fieldName: 'someField',
                fieldNodes: [
                    {
                        kind: 'Field',
                        name: {
                            kind: 'Name',
                            value: 'someField',
                        },
                    },
                ],
                parentType: 'Query',
            };
            const buildRenderContext = jest.spyOn(template, 'buildRenderContext');
            const values = {
                array: ['some', 'values'],
                mapObject: { some: 'value' },
            };
            template.render({
                arguments: values,
                source: values,
                stash: values,
                result: values,
            }, {
                headers: { Key: 'value' },
                requestAuthorizationMode: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
            }, info);
            expect(buildRenderContext).toHaveBeenCalled();
            const ctx = buildRenderContext.mock.results[0].value.ctx;
            expect(ctx.args.array).toBeInstanceOf(array_1.JavaArray);
            expect(ctx.args.mapObject).toBeInstanceOf(map_1.JavaMap);
            expect(ctx.source.array).toBeInstanceOf(array_1.JavaArray);
            expect(ctx.source.mapObject).toBeInstanceOf(map_1.JavaMap);
            expect(ctx.stash.array).toBeInstanceOf(array_1.JavaArray);
            expect(ctx.stash.mapObject).toBeInstanceOf(map_1.JavaMap);
            expect(ctx.info.selectionSetList).toBeInstanceOf(array_1.JavaArray);
        });
    });
});
//# sourceMappingURL=index.test.js.map