"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pipeline_resolver_1 = require("../../resolvers/pipeline-resolver");
const type_definition_1 = require("../../type-definition");
describe('Pipeline Resolvers', () => {
    const getFunction = jest.fn();
    const getMappingTemplate = jest.fn();
    const simulatorContext = {
        getFunction,
        getMappingTemplate,
    };
    let baseConfig;
    beforeEach(() => {
        jest.resetAllMocks();
        getFunction.mockReturnValue({ resolve: () => 'foo' });
        getMappingTemplate.mockReturnValue('TEMPLATE');
        baseConfig = {
            fieldName: 'fn1',
            typeName: 'Query',
            kind: type_definition_1.RESOLVER_KIND.PIPELINE,
            functions: ['fn1', 'fn2'],
        };
    });
    it('should initialize when the request and response mapping templates are inline templates', () => {
        const config = {
            ...baseConfig,
            requestMappingTemplate: 'request',
            responseMappingTemplate: 'response',
        };
        expect(() => new pipeline_resolver_1.AppSyncPipelineResolver(config, simulatorContext)).not.toThrow();
        expect(getMappingTemplate).not.toHaveBeenCalled();
    });
    it('should work when the request and response mapping are external template', () => {
        const config = {
            ...baseConfig,
            requestMappingTemplateLocation: 'resolvers/request',
            responseMappingTemplateLocation: 'resolvers/response',
        };
        expect(() => new pipeline_resolver_1.AppSyncPipelineResolver(config, simulatorContext)).not.toThrow();
        expect(getMappingTemplate).toHaveBeenCalledTimes(2);
    });
    it('should throw error when templates are missing', () => {
        getMappingTemplate.mockImplementation(() => {
            throw new Error('mock error');
        });
        expect(() => new pipeline_resolver_1.AppSyncPipelineResolver(baseConfig, simulatorContext)).toThrowError('Missing response mapping template mock error');
        expect(getMappingTemplate).toHaveBeenCalled();
    });
    describe('resolve', () => {
        let resolver;
        const baseConfig = {
            fieldName: 'fn1',
            typeName: 'Query',
            kind: type_definition_1.RESOLVER_KIND.PIPELINE,
            functions: ['fn1', 'fn2'],
            requestMappingTemplateLocation: 'request',
            responseMappingTemplateLocation: 'response',
        };
        let templates;
        let fnImpl;
        beforeEach(() => {
            fnImpl = {
                fn1: {
                    resolve: jest.fn().mockImplementation((source, args, stash, prevResult, context, info) => ({
                        result: 'FN1-RESULT',
                        args,
                        stash: { ...stash, exeSeq: [...(stash.exeSeq || []), 'fn1'] },
                    })),
                },
                fn2: {
                    resolve: jest.fn().mockImplementation((source, args, stash, prevResult, context, info) => ({
                        args,
                        result: 'FN2-RESULT',
                        stash: { ...stash, exeSeq: [...(stash.exeSeq || []), 'fn2'] },
                    })),
                },
            };
            getFunction.mockImplementation((fnName) => fnImpl[fnName]);
            templates = {
                request: {
                    render: jest.fn().mockImplementation(({ stash, arguments: args }) => ({
                        result: 'REQUEST_TEMPLATE_RESULT',
                        errors: [],
                        args,
                        stash: { ...stash, exeSeq: [...(stash.exeSeq || []), 'REQUEST-MAPPING-TEMPLATE'] },
                    })),
                },
                response: {
                    render: jest.fn().mockImplementation(({ stash, arguments: args }) => ({
                        result: 'RESPONSE_TEMPLATE_RESULT',
                        errors: [],
                        args,
                        stash: { ...stash, exeSeq: [...stash.exeSeq, 'fn2'] },
                    })),
                },
            };
            getMappingTemplate.mockImplementation((templateName) => templates[templateName]);
            resolver = new pipeline_resolver_1.AppSyncPipelineResolver(baseConfig, simulatorContext);
        });
        it('should render requestMapping template', async () => {
            const source = 'SOURCE';
            const args = { arg1: 'val' };
            const context = {
                appsyncErrors: [],
            };
            const info = {};
            const result = await resolver.resolve(source, args, context, info);
            expect(result).toEqual('RESPONSE_TEMPLATE_RESULT');
            expect(templates['request'].render).toHaveBeenCalledWith({
                source,
                arguments: args,
                stash: {},
            }, context, info);
            expect(getMappingTemplate).toHaveBeenCalledTimes(4);
            expect(getFunction).toHaveBeenCalled();
        });
        it('should pass stash and prevResult between functions and templates', async () => {
            const source = 'SOURCE';
            const args = { arg1: 'val' };
            const context = {
                appsyncErrors: [],
            };
            const info = {};
            const result = await resolver.resolve(source, args, context, info);
            expect(result).toEqual('RESPONSE_TEMPLATE_RESULT');
            expect(fnImpl.fn1.resolve).toHaveBeenLastCalledWith(source, args, { exeSeq: ['REQUEST-MAPPING-TEMPLATE'] }, 'REQUEST_TEMPLATE_RESULT', context, info);
            expect(fnImpl.fn2.resolve).toHaveBeenLastCalledWith(source, args, { exeSeq: ['REQUEST-MAPPING-TEMPLATE', 'fn1'] }, 'FN1-RESULT', context, info);
            expect(templates['response'].render).toHaveBeenCalledWith({
                source,
                arguments: args,
                prevResult: 'FN2-RESULT',
                result: 'FN2-RESULT',
                stash: { exeSeq: ['REQUEST-MAPPING-TEMPLATE', 'fn1', 'fn2'] },
            }, context, info);
        });
        it('should preserve changes arguments between the pipeline functions', async () => {
            const source = 'SOURCE';
            const args = { arg1: 'val' };
            const context = {
                appsyncErrors: [],
            };
            const info = {};
            fnImpl.fn1.resolve.mockImplementation((source, args, stash, prevResult, context, info) => ({
                result: 'FN1-RESULT',
                args: { ...args, fn1Arg: 'FN1-ARG1' },
                stash: { ...stash, exeSeq: [...(stash.exeSeq || []), 'fn1'] },
            }));
            fnImpl.fn2.resolve.mockImplementation((source, args, stash, prevResult, context, info) => ({
                result: 'FN2-RESULT',
                args: { ...args, fn2Arg: 'FN2-ARG1' },
                stash: { ...stash, exeSeq: [...(stash.exeSeq || []), 'fn2'] },
            }));
            await resolver.resolve(source, args, context, info);
            expect(fnImpl.fn2.resolve).toHaveBeenLastCalledWith(source, { ...args, fn1Arg: 'FN1-ARG1' }, { exeSeq: ['REQUEST-MAPPING-TEMPLATE', 'fn1'] }, 'FN1-RESULT', context, info);
            expect(templates['response'].render).toHaveBeenCalledWith({
                source,
                arguments: { ...args, fn1Arg: 'FN1-ARG1', fn2Arg: 'FN2-ARG1' },
                prevResult: 'FN2-RESULT',
                result: 'FN2-RESULT',
                stash: { exeSeq: ['REQUEST-MAPPING-TEMPLATE', 'fn1', 'fn2'] },
            }, context, info);
        });
        it('should not call response mapping template when #return is called', async () => {
            templates.request.render.mockReturnValue({ isReturn: true, result: 'REQUEST_TEMPLATE_RESULT', templateErrors: [] });
            const source = 'SOURCE';
            const args = { arg1: 'val' };
            const context = {
                appsyncErrors: [],
            };
            const info = {};
            const result = await resolver.resolve(source, args, context, info);
            expect(result).toEqual('REQUEST_TEMPLATE_RESULT');
        });
        it('should merge template errors', async () => {
            templates.request.render.mockReturnValue({
                isReturn: false,
                stash: {},
                result: 'REQUEST_TEMPLATE_RESULT',
                errors: ['REQUEST_TEMPLATE_ERROR'],
            });
            templates.response.render.mockReturnValue({
                isReturn: false,
                result: 'RESPONSE_TEMPLATE_RESULT',
                errors: ['RESPONSE_TEMPLATE_ERROR'],
            });
            const source = 'SOURCE';
            const args = { arg1: 'val' };
            const context = {
                appsyncErrors: [],
            };
            const info = {};
            const result = await resolver.resolve(source, args, context, info);
            expect(result).toEqual('RESPONSE_TEMPLATE_RESULT');
            expect(context.appsyncErrors).toEqual(['REQUEST_TEMPLATE_ERROR', 'RESPONSE_TEMPLATE_ERROR']);
        });
        it('bails out early on terminal error', async () => {
            resolver = new pipeline_resolver_1.AppSyncPipelineResolver(baseConfig, simulatorContext);
            fnImpl.fn1 = {
                resolve: jest.fn().mockImplementation((source, args, stash, prevResult, context, info) => {
                    const err = new Error('fn1-ERROR');
                    context.appsyncErrors = [...context.appsyncErrors, err];
                    return {
                        result: err.message,
                        stash: { ...stash, exeSeq: [...(stash.exeSeq || []), 'fn1'] },
                        hadException: true,
                    };
                }),
            };
            const source = 'SOURCE';
            const context = {
                appsyncErrors: [],
            };
            const result = await resolver.resolve(source, {}, context, {});
            expect(result).toEqual('fn1-ERROR');
        });
    });
});
//# sourceMappingURL=pipeline-resolver.test.js.map