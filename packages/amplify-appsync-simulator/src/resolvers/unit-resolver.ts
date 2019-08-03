import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorUnitResolverConfig } from '../type-definition';

export class AppSyncUnitResolver {
  private config: AppSyncSimulatorUnitResolverConfig;
  constructor(
    config: AppSyncSimulatorUnitResolverConfig,
    private simulatorContext: AmplifyAppSyncSimulator
  ) {
    try {
      simulatorContext.getMappingTemplate(config.requestMappingTemplateLocation);
      simulatorContext.getMappingTemplate(config.responseMappingTemplateLocation);
      simulatorContext.getDataLoader(config.dataSourceName);
    } catch (e) {
      throw new Error(`Invalid config for UNIT_RESOLVER ${JSON.stringify(config)} \n ${e.message}`);
    }
    const { fieldName, typeName } = config;
    if (!fieldName || !typeName) {
      throw new Error(`Invalid config for UNIT_RESOLVER ${JSON.stringify(config)}`);
    }
    this.config = config;
  }

  async resolve(source, args, context, info) {
    const requestMappingTemplate = this.simulatorContext.getMappingTemplate(
      this.config.requestMappingTemplateLocation
    );
    const responseMappingTemplate = this.simulatorContext.getMappingTemplate(
      this.config.responseMappingTemplateLocation
    );
    const dataLoader = this.simulatorContext.getDataLoader(this.config.dataSourceName);
    const { result: requestPayload } = requestMappingTemplate.render(
      { source, arguments: args },
      context,
      info
    );
    const result = await dataLoader.load(requestPayload);
    const { result: responseTemplateResult } = responseMappingTemplate.render(
      { source, arguments: args, result },
      context,
      info
    );
    return responseTemplateResult;
  }
}
