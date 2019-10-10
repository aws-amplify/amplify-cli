import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorUnitResolverConfig } from '../type-definition';

export class AppSyncUnitResolver {
  private config: AppSyncSimulatorUnitResolverConfig;
  constructor(config: AppSyncSimulatorUnitResolverConfig, private simulatorContext: AmplifyAppSyncSimulator) {
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
    const requestMappingTemplate = this.simulatorContext.getMappingTemplate(this.config.requestMappingTemplateLocation);
    const responseMappingTemplate = this.simulatorContext.getMappingTemplate(this.config.responseMappingTemplateLocation);
    const dataLoader = this.simulatorContext.getDataLoader(this.config.dataSourceName);
    const { result: requestPayload, errors: requestTemplateErrors } = requestMappingTemplate.render(
      { source, arguments: args },
      context,
      info
    );
    context.appsyncErrors = [...context.appsyncErrors, ...requestTemplateErrors];
    let result = null;
    let error;
    try {
      result = await dataLoader.load(requestPayload);
    } catch (e) {
      if (requestPayload && requestPayload.version === '2018-05-29') {
        // https://docs.aws.amazon.com/appsync/latest/devguide/resolver-mapping-template-changelog.html#aws-appsync-resolver-mapping-template-version-2018-05-29
        error = e;
      } else {
        throw e;
      }
    }
    if (requestPayload && requestPayload.version !== '2018-05-29' && result === null) {
      return;
    }

    const { result: responseTemplateResult, errors: responseTemplateErrors } = responseMappingTemplate.render(
      { source, arguments: args, result, error },
      context,
      info
    );
    context.appsyncErrors = [...context.appsyncErrors, ...responseTemplateErrors];

    return responseTemplateResult;
  }
}
