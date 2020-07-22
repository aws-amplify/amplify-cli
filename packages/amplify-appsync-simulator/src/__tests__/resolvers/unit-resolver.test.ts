import { AppSyncUnitResolver } from '../../resolvers/unit-resolver';
import { AmplifyAppSyncSimulator } from '../..';
import { RESOLVER_KIND, AppSyncSimulatorUnitResolverConfig } from '../../type-definition';

describe('Unit resolver', () => {
  const getDataLoader = jest.fn();
  const getMappingTemplate = jest.fn();
  const simulatorContext: AmplifyAppSyncSimulator = ({
    getDataLoader,
    getMappingTemplate,
  } as any) as AmplifyAppSyncSimulator;
  let baseConfig;

  beforeEach(() => {
    jest.resetAllMocks();
    getDataLoader.mockReturnValue({
      load: () => {
        return 'DATA';
      },
    });
    getMappingTemplate.mockReturnValue('TEMPLATE');
    baseConfig = {
      fieldName: 'getPost',
      typeName: 'Query',
      kind: RESOLVER_KIND.UNIT,
      dataSourceName: 'TodoTable',
    };
  });

  it('should initialize when the request and response mapping templates are inline templates', () => {
    const config: AppSyncSimulatorUnitResolverConfig = {
      ...baseConfig,
      requestMappingTemplate: 'request',
      responseMappingTemplate: 'response',
    };
    expect(() => new AppSyncUnitResolver(config, simulatorContext)).not.toThrow();
    expect(getMappingTemplate).not.toHaveBeenCalled();
  });

  it('should work when the request and response mapping are external template', () => {
    const config: AppSyncSimulatorUnitResolverConfig = {
      ...baseConfig,
      requestMappingTemplateLocation: 'resolvers/request',
      responseMappingTemplateLocation: 'resolvers/response',
    };
    expect(() => new AppSyncUnitResolver(config, simulatorContext)).not.toThrow();
    expect(getMappingTemplate).toHaveBeenCalledTimes(2);
  });

  it('should throw error when request templates are missing', () => {
    getMappingTemplate.mockImplementation(() => {
      throw new Error('Missing template');
    });
    expect(() => new AppSyncUnitResolver(baseConfig, simulatorContext)).toThrowError('Missing request mapping template');
    expect(getMappingTemplate).toHaveBeenCalled();
  });

  describe('resolve', () => {
    let templates;
    let resolver;

    const info = {};
    const DATA_FROM_DATA_SOURCE = 'DATA FROM DATA SOURCE';
    const REQUEST_TEMPLATE_RESULT = {
      version: '2017-02-29',
      result: 'REQUEST_TEMPLATE_RESULT',
    };
    const RESPONSE_TEMPLATE_RESULT = {
      version: '2017-02-29',
      data: 'RESPONSE_TEMPLATE_RESULT',
    };
    let dataFetcher;

    const source = 'SOURCE';
    const args = { key: 'value' };
    const context = {
      appsyncErrors: [],
    };

    beforeEach(() => {
      context.appsyncErrors = [];
      templates = {
        request: {
          render: jest.fn().mockImplementation(() => ({
            result: REQUEST_TEMPLATE_RESULT,
            errors: [],
          })),
        },
        response: {
          render: jest.fn().mockImplementation(() => ({
            result: RESPONSE_TEMPLATE_RESULT,
            errors: [],
          })),
        },
      };

      dataFetcher = jest.fn().mockResolvedValue(DATA_FROM_DATA_SOURCE);

      getDataLoader.mockReturnValue({
        load: dataFetcher,
      });
      getMappingTemplate.mockImplementation(templateName => {
        return templates[templateName];
      });

      resolver = new AppSyncUnitResolver(
        { ...baseConfig, requestMappingTemplateLocation: 'request', responseMappingTemplateLocation: 'response' },
        simulatorContext,
      );
    });

    it('should resolve', async () => {
      const result = await resolver.resolve(source, args, context, info);
      expect(result).toEqual(RESPONSE_TEMPLATE_RESULT);
      expect(templates.request.render).toHaveBeenCalledWith({ source, arguments: args }, context, info);
      expect(dataFetcher).toHaveBeenCalledWith(REQUEST_TEMPLATE_RESULT);
      expect(getDataLoader).toBeCalledWith('TodoTable');
      expect(templates.response.render).toHaveBeenCalledWith({ source, arguments: args, result: DATA_FROM_DATA_SOURCE }, context, info);
    });

    it('should not call the response mapping template with template version 2017-02-29 and data fetcher throws error', async () => {
      dataFetcher.mockImplementation(() => {
        throw new Error('Some request template error');
      });

      await expect(() => resolver.resolve(source, args, context, info)).rejects.toThrowError('Some request template error');
      expect(templates.request.render).toHaveBeenCalledWith({ source, arguments: args }, context, info);
      expect(dataFetcher).toHaveBeenCalledWith(REQUEST_TEMPLATE_RESULT);
      expect(getDataLoader).toBeCalledWith('TodoTable');
      expect(templates.response.render).not.toHaveBeenCalled();
    });

    it('should render response mapping when data fetcher throws error and template version is 2018-05-29', async () => {
      REQUEST_TEMPLATE_RESULT.version = '2018-05-29';
      const error = new Error('Some request template error');
      dataFetcher.mockImplementation(() => {
        throw error;
      });
      const result = await resolver.resolve(source, args, context, info);
      expect(result).toEqual(RESPONSE_TEMPLATE_RESULT);
      expect(templates.request.render).toHaveBeenCalledWith({ source, arguments: args }, context, info);
      expect(dataFetcher).toHaveBeenCalledWith(REQUEST_TEMPLATE_RESULT);
      expect(getDataLoader).toBeCalledWith('TodoTable');
      expect(templates.response.render).toHaveBeenCalledWith({ source, arguments: args, error: error, result: null }, context, info);
    });

    it('should not render response mapping template when #return is used in request mapping template', async () => {
      REQUEST_TEMPLATE_RESULT.version = '2018-05-29';
      templates.request.render.mockReturnValue({
        ...REQUEST_TEMPLATE_RESULT,
        errors: [],
        isReturn: true,
      });

      const result = await resolver.resolve(source, args, context, info);
      expect(result).toEqual(REQUEST_TEMPLATE_RESULT.result);
      expect(templates.request.render).toHaveBeenCalledWith({ source, arguments: args }, context, info);
      expect(dataFetcher).not.toHaveBeenCalledWith(REQUEST_TEMPLATE_RESULT);
      expect(templates.response.render).not.toHaveBeenCalled();
    });

    it('should collect all the errors in context object', async () => {
      templates.request.render.mockReturnValue({
        ...REQUEST_TEMPLATE_RESULT,
        errors: ['request error'],
      });
      templates.response.render.mockReturnValue({
        ...REQUEST_TEMPLATE_RESULT,
        errors: ['response error'],
      });
      const result = await resolver.resolve(source, args, context, info);
      expect(result).toEqual(REQUEST_TEMPLATE_RESULT.result);
      expect(context.appsyncErrors).toEqual(['request error', 'response error']);
    });
  });
});
