import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorFunctionResolverConfig } from '../type-definition';
import { VelocityTemplate } from '../velocity';
import { AppSyncBaseResolver } from './base-resolver';

export class AmplifySimulatorFunction extends AppSyncBaseResolver {
  constructor(protected config: AppSyncSimulatorFunctionResolverConfig, simulatorContext: AmplifyAppSyncSimulator) {
    super(config, simulatorContext);
    const { dataSourceName } = config;
    if (!dataSourceName) {
      throw new Error(`Invalid configuration parameter for function ${JSON.stringify(config)}. Missing DataSource Name`);
    }
    const dataSource = simulatorContext.getDataLoader(dataSourceName);

    if (!dataSource) {
      throw new Error(`Missing data source ${dataSourceName}`);
    }
  }

  async resolve(source, args, stash, prevResult, context, info): Promise<{ result: any; stash: any }> {
    let result = null;
    let error = null;
    const requestMappingTemplate = this.getRequestMappingTemplate();
    const responseMappingTemplate = this.getResponseMappingTemplate();
    const dataLoader = this.simulatorContext.getDataLoader(this.config.dataSourceName);

    const requestTemplateResult = await requestMappingTemplate.render({ source, arguments: args, stash, prevResult }, context, info);
    context.appsyncErrors = [...context.appsyncErrors, ...requestTemplateResult.errors];

    if (requestTemplateResult.isReturn) {
      // #return was used in template, bail and don't run data invoker
      return {
        result: requestTemplateResult.result,
        stash: requestTemplateResult.stash,
      };
    }
    try {
      result = await dataLoader.load(requestTemplateResult.result);
    } catch (e) {
      // pipeline resolver does not throw error
      // https://docs.aws.amazon.com/appsync/latest/devguide/resolver-mapping-template-changelog.html#aws-appsync-resolver-mapping-template-version-2018-05-29
      error = e;
    }

    const responseMappingResult = await responseMappingTemplate.render(
      { source, arguments: args, result, stash: requestTemplateResult.stash, prevResult, error },
      context,
      info,
    );
    context.appsyncErrors = [...context.appsyncErrors, ...responseMappingResult.errors];
    return {
      stash: responseMappingResult.stash,
      result: responseMappingResult.result,
    };
  }
}
