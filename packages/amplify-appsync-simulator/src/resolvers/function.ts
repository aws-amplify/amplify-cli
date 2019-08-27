import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorFunctionResolverConfig } from '../type-definition';

export class AmplifySimulatorFunction {
  constructor(
    private config: AppSyncSimulatorFunctionResolverConfig,
    private simulatorContext: AmplifyAppSyncSimulator
  ) {
    const {
      dataSourceName,
      requestMappingTemplateLocation,
      responseMappingTemplateLocation,
    } = config;
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

  async resolve(
    source,
    args,
    stash,
    prevResult,
    context,
    info
  ): Promise<{ result: any; stash: any }> {
    const requestMappingTemplate = this.simulatorContext.getMappingTemplate(
      this.config.requestMappingTemplateLocation
    );
    const responseMappingTemplate = this.simulatorContext.getMappingTemplate(
      this.config.responseMappingTemplateLocation
    );
    const dataLoader = this.simulatorContext.getDataLoader(this.config.dataSourceName);
    let requestPayload;
    ({ result: requestPayload, stash } = await requestMappingTemplate.render(
      { source, arguments: args, stash, prevResult },
      context,
      info
    ));

    const result = await dataLoader.load(requestPayload);
    return await responseMappingTemplate.render(
      { source, arguments: args, result, stash, prevResult },
      context,
      info
    );
  }
}
