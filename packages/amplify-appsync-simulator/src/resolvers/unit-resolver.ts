import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorUnitResolverConfig } from '../type-definition';
import { AppSyncBaseResolver } from './base-resolver';

export class AppSyncUnitResolver extends AppSyncBaseResolver {
  protected config: AppSyncSimulatorUnitResolverConfig;
  constructor(config: AppSyncSimulatorUnitResolverConfig, simulatorContext: AmplifyAppSyncSimulator) {
    super(config, simulatorContext);
    try {
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

  async resolve(source, args, context, info): Promise<any> {
    const requestMappingTemplate = this.getRequestMappingTemplate();
    const responseMappingTemplate = this.getResponseMappingTemplate();
    const dataLoader = this.simulatorContext.getDataLoader(this.config.dataSourceName);
    const { result: requestPayload, errors: requestTemplateErrors, isReturn } = requestMappingTemplate.render(
      { source, arguments: args },
      context,
      info,
    );
    context.appsyncErrors = [...context.appsyncErrors, ...requestTemplateErrors];
    let result = null;
    let error;
    if (isReturn) {
      // template has #return bail and return the value specified in the template
      return requestPayload;
    }
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
      info,
    );
    context.appsyncErrors = [...context.appsyncErrors, ...responseTemplateErrors];

    return responseTemplateResult;
  }
}
