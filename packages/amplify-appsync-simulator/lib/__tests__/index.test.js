"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../");
const schema_1 = require("../schema");
const velocity_1 = require("../velocity");
const type_definition_1 = require("../type-definition");
jest.mock('../schema');
jest.mock('../velocity');
const generateResolversMock = schema_1.generateResolvers;
const VelocityTemplateMock = velocity_1.VelocityTemplate;
describe('AmplifyAppSyncSimulator', () => {
    let simulator;
    let baseConfig;
    beforeEach(() => {
        const schema = `type Query {
      noop: String
    }`;
        simulator = new __1.AmplifyAppSyncSimulator();
        baseConfig = {
            appSync: {
                defaultAuthenticationType: { authenticationType: type_definition_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY },
                name: 'test',
                apiKey: 'fake-api-key',
                additionalAuthenticationProviders: [],
            },
            schema: {
                content: schema,
            },
            mappingTemplates: [],
        };
    });
    it('should support accept minimal configuration', () => {
        generateResolversMock.mockReturnValueOnce('MOCK SCHEMA');
        expect(() => simulator.init(baseConfig)).not.toThrowError();
        expect(simulator.schema).toEqual('MOCK SCHEMA');
        expect(schema_1.generateResolvers).toHaveBeenCalled();
        expect(simulator.appSyncConfig);
    });
    it('should retain the original configuration when config has error', () => {
        const resolver = {
            fieldName: 'echo',
            typeName: 'Query',
            dataSourceName: 'echoFn',
            kind: type_definition_1.RESOLVER_KIND.UNIT,
            requestMappingTemplateLocation: 'missing/Resolver.req.vtl',
            responseMappingTemplateLocation: 'missing/Resolver.resp.vtl',
        };
        const configWithError = {
            ...baseConfig,
            resolvers: [resolver],
        };
        const oldConfig = simulator.config;
        expect(() => simulator.init(configWithError)).toThrowError();
        expect(simulator.config).toStrictEqual(oldConfig);
    });
    describe('mapping templates', () => {
        it('should support mapping template', () => {
            const mappingTemplate = {
                path: 'path/to/template.vtl',
                content: 'Foo bar baz',
            };
            baseConfig.mappingTemplates = [mappingTemplate];
            expect(() => simulator.init(baseConfig)).not.toThrowError();
            expect(velocity_1.VelocityTemplate).toHaveBeenCalledWith(mappingTemplate, simulator);
            expect(simulator.getMappingTemplate(mappingTemplate.path)).toBeInstanceOf(VelocityTemplateMock);
            expect(() => simulator.getMappingTemplate('missing/path')).toThrowError();
        });
        it('should normalize windows style path to unix path', () => {
            const mappingTemplate = {
                path: 'path\\to\\template.vtl',
                content: 'Foo bar baz',
            };
            const normalizedPath = 'path/to/template.vtl';
            baseConfig.mappingTemplates = [mappingTemplate];
            expect(() => simulator.init(baseConfig)).not.toThrowError();
            expect(velocity_1.VelocityTemplate).toHaveBeenCalledWith({ ...mappingTemplate, path: normalizedPath }, simulator);
            expect(simulator.getMappingTemplate(normalizedPath)).toBeInstanceOf(VelocityTemplateMock);
            expect(() => simulator.getMappingTemplate(mappingTemplate.path)).toThrowError('Missing mapping template');
        });
        it('should handle templates when path is missing', () => {
            const mappingTemplate = {
                content: 'Foo bar baz',
            };
            baseConfig.mappingTemplates = [mappingTemplate];
            expect(() => simulator.init(baseConfig)).not.toThrowError();
            expect(velocity_1.VelocityTemplate).toHaveBeenCalledWith(mappingTemplate, simulator);
        });
    });
});
//# sourceMappingURL=index.test.js.map