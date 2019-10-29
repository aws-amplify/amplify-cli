import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorFunctionResolverConfig } from '../type-definition';

export class AmplifySimulatorFunction {
  constructor(private config: AppSyncSimulatorFunctionResolverConfig, private simulatorContext: AmplifyAppSyncSimulator) {
    const { dataSourceName, requestMappingTemplateLocation, responseMappingTemplateLocation } = config;
    if (!dataSourceName || !requestMappingTemplateLocation || !responseMappingTemplateLocation) {
      throw new Error(`Invalid configuration parameter for function ${JSON.stringify(config)}`);
    }
    const dataSource = simulatorContext.getDataLoader(dataSourceName);
    const req = simulatorContext.getMappingTemplate(requestMappingTemplateLocation);
    const resp = simulatorContext.getMappingTemplate(responseMappingTemplateLocation);
    if (!dataSource) {
      throw new Error(`Missing data source ${dataSourceName}`);
    }
    if (!req) {
      throw new Error(`Missing request mapping template ${requestMappingTemplateLocation}`);
    }
    if (!resp) {
      throw new Error(`Missing request mapping template ${responseMappingTemplateLocation}`);
    }
    this.config = config;
  }

  async resolve(source, args, stash, prevResult, context, info): Promise<{ result: any; stash: any }> {
    let result = null;
    let error = null;
    const requestMappingTemplate = this.simulatorContext.getMappingTemplate(this.config.requestMappingTemplateLocation);
    const responseMappingTemplate = this.simulatorContext.getMappingTemplate(this.config.responseMappingTemplateLocation);
    const dataLoader = this.simulatorContext.getDataLoader(this.config.dataSourceName);

    const requestTemplateResult = await requestMappingTemplate.render({ source, arguments: args, stash, prevResult }, context, info);
    context.appsyncErrors = [...context.appsyncErrors, ...requestTemplateResult.errors];

    try {
      result = await dataLoader.load(requestTemplateResult.result);
    } catch (e) {
      // pipeline resolver does not throw error
      // https://docs.aws.amazon.com/appsync/latest/devguide/resolver-mapping-template-changelog.html#aws-appsync-resolver-mapping-template-version-2018-05-29
      error = e;
    }

    const responseMappingResult = await responseMappingTemplate.render(
      { source, arguments: args, result, stash, prevResult, error },
      context,
      info
    );
    context.appsyncErrors = [...context.appsyncErrors, ...responseMappingResult.errors];
    return {
      stash: responseMappingResult.stash,
      result: responseMappingResult.result,
    };
  }
}
