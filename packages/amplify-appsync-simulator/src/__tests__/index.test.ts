import { AmplifyAppSyncSimulator } from '../';
import { generateResolvers } from '../schema';
import { VelocityTemplate } from '../velocity';

import {
  AmplifyAppSyncSimulatorAuthenticationType,
  AppSyncSimulatorDataSourceNoneConfig,
  AmplifyAppSyncSimulatorConfig,
  AppSyncMockFile,
  AppSyncSimulatorBaseResolverConfig,
  RESOLVER_KIND,
  AppSyncSimulatorUnitResolverConfig,
} from '../type-definition';

jest.mock('../schema');
jest.mock('../velocity');

const generateResolversMock = generateResolvers as jest.Mock;
const VelocityTemplateMock = VelocityTemplate as jest.Mock<VelocityTemplate>;

describe('AmplifyAppSyncSimulator', () => {
  let simulator: AmplifyAppSyncSimulator;
  let baseConfig: AmplifyAppSyncSimulatorConfig;
  beforeEach(() => {
    const schema = `type Query {
      noop: String
    }`;

    simulator = new AmplifyAppSyncSimulator();
    baseConfig = {
      appSync: {
        defaultAuthenticationType: { authenticationType: AmplifyAppSyncSimulatorAuthenticationType.API_KEY },
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
    expect(generateResolvers).toHaveBeenCalled();
    expect(simulator.appSyncConfig);
  });

  it('should retain the original configuration when config has error', () => {
    const resolver: AppSyncSimulatorUnitResolverConfig = {
      fieldName: 'echo',
      typeName: 'Query',
      dataSourceName: 'echoFn',
      kind: RESOLVER_KIND.UNIT,
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
      const mappingTemplate: AppSyncMockFile = {
        path: 'path/to/template.vtl',
        content: 'Foo bar baz',
      };
      baseConfig.mappingTemplates = [mappingTemplate];
      expect(() => simulator.init(baseConfig)).not.toThrowError();
      expect(VelocityTemplate).toHaveBeenCalledWith(mappingTemplate, simulator);
      expect(simulator.getMappingTemplate(mappingTemplate.path)).toBeInstanceOf(VelocityTemplateMock);
      expect(() => simulator.getMappingTemplate('missing/path')).toThrowError();
    });

    it('should normalize windows style path to unix path', () => {
      const mappingTemplate: AppSyncMockFile = {
        path: 'path\\to\\template.vtl',
        content: 'Foo bar baz',
      };
      const normalizedPath = 'path/to/template.vtl';
      baseConfig.mappingTemplates = [mappingTemplate];
      expect(() => simulator.init(baseConfig)).not.toThrowError();
      expect(VelocityTemplate).toHaveBeenCalledWith({ ...mappingTemplate, path: normalizedPath }, simulator);
      expect(simulator.getMappingTemplate(normalizedPath)).toBeInstanceOf(VelocityTemplateMock);
      expect(() => simulator.getMappingTemplate(mappingTemplate.path)).toThrowError('Missing mapping template');
    });

    it('should handle templates when path is missing', () => {
      const mappingTemplate: AppSyncMockFile = {
        content: 'Foo bar baz',
      };
      baseConfig.mappingTemplates = [mappingTemplate];
      expect(() => simulator.init(baseConfig)).not.toThrowError();
      expect(VelocityTemplate).toHaveBeenCalledWith(mappingTemplate, simulator);
    });
  });
});
