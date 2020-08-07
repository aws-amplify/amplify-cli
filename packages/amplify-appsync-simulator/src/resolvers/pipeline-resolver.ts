import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorPipelineResolverConfig } from '../type-definition';
import { AppSyncBaseResolver } from './base-resolver';

export class AppSyncPipelineResolver extends AppSyncBaseResolver {
  constructor(protected config: AppSyncSimulatorPipelineResolverConfig, simulatorContext: AmplifyAppSyncSimulator) {
    super(config, simulatorContext);
    try {
      config.functions.map(fn => simulatorContext.getFunction(fn));
    } catch (e) {
      throw new Error(`Invalid config for PIPELINE_RESOLVER ${JSON.stringify(config)}`);
    }
    const { fieldName, typeName } = config;
    if (!fieldName || !typeName) {
      throw new Error(`Invalid config for PIPELINE_RESOLVER.FieldName or typeName is missing.\n ${JSON.stringify(config)}`);
    }
    this.config = config;
  }

  async resolve(source, args, context, info) {
    const requestMappingTemplate = this.getRequestMappingTemplate();
    const responseMappingTemplate = this.getResponseMappingTemplate();

    let result = {};
    let stash = {};
    let templateErrors;
    let isReturn;

    // Pipeline request mapping template
    ({ result, stash, errors: templateErrors, isReturn } = requestMappingTemplate.render(
      { source, arguments: args, stash },
      context,
      info,
    ));

    context.appsyncErrors = [...context.appsyncErrors, ...(templateErrors || [])];

    if (isReturn) {
      //Request mapping template called #return, don't process further
      return result;
    }

    let prevResult = result;
    for (let fnName of this.config.functions) {
      const fnResolver = this.simulatorContext.getFunction(fnName);
      ({ result: prevResult, stash } = await fnResolver.resolve(source, args, stash, prevResult, context, info));
    }

    // pipeline response mapping template
    ({ result, errors: templateErrors } = responseMappingTemplate.render(
      { source, arguments: args, result: prevResult, prevResult, stash },
      context,
      info,
    ));
    context.appsyncErrors = [...context.appsyncErrors, ...(templateErrors || [])];
    return result;
  }
}
