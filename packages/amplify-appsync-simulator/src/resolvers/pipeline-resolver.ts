import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorPipelineResolverConfig } from '../type-definition';

export class AppSyncPipelineResolver {
  private config: AppSyncSimulatorPipelineResolverConfig;
  constructor(
    config: AppSyncSimulatorPipelineResolverConfig,
    private simulatorContext: AmplifyAppSyncSimulator
  ) {
    try {
      simulatorContext.getMappingTemplate(config.requestMappingTemplateLocation);
      simulatorContext.getMappingTemplate(config.responseMappingTemplateLocation);
      config.functions.map(fn => simulatorContext.getFunction(fn));
    } catch (e) {
      throw new Error(`Invalid config for PIPELINE_RESOLVER ${JSON.stringify(config)}`);
    }
    const { fieldName, typeName } = config;
    if (!fieldName || !typeName) {
      throw new Error(`Invalid config for PIPELINE_RESOLVER ${JSON.stringify(config)}`);
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

    let result = {};
    let stash = {};

    ({ result, stash } = requestMappingTemplate.render(
      { source, arguments: args, stash },
      context,
      info
    ));

    await this.config.functions
      .reduce((chain, fn) => {
        const fnResolver = this.simulatorContext.getFunction(fn);
        const p = chain.then(async ({ prevResult, stash }) => {
          ({ result: prevResult, stash } = await fnResolver.resolve(
            source,
            args,
            stash,
            prevResult,
            context,
            info
          ));
          return Promise.resolve({ prevResult, stash });
        });
        return p;
      }, Promise.resolve({ prevResult: result, stash }))
      .then(({ prevResult: lastResult }) => {
        result = lastResult;
      });
    return responseMappingTemplate.render(
      { source, arguments: args, result, prevResult: result },
      context,
      info
    ).result;
  }
}
