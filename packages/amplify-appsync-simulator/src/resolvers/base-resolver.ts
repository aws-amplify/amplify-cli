import { AmplifyAppSyncSimulator } from '..';
import { AppSyncSimulatorBaseResolverConfig } from '../type-definition';
import { VelocityTemplate } from '../velocity';

export abstract class AppSyncBaseResolver {
  constructor(protected config: AppSyncSimulatorBaseResolverConfig, protected simulatorContext: AmplifyAppSyncSimulator) {
    try {
      this.getResponseMappingTemplate();
    } catch (e) {
      throw new Error(`Missing response mapping template ${e.message}`);
    }

    try {
      this.getRequestMappingTemplate();
    } catch (e) {
      throw new Error(`Missing request mapping template ${e.message}`);
    }
  }
  // abstract async resolve(source, args, context, info): Promise<any>; 

  protected getResponseMappingTemplate(): VelocityTemplate {
    if (this.config.responseMappingTemplate) {
      return new VelocityTemplate(
        {
          path: 'INLINE_TEMPLATE',
          content: this.config.responseMappingTemplate,
        },
        this.simulatorContext,
      );
    }
    return this.simulatorContext.getMappingTemplate(this.config.responseMappingTemplateLocation);
  }

  protected getRequestMappingTemplate(): VelocityTemplate {
    if (this.config.requestMappingTemplate) {
      return new VelocityTemplate(
        {
          path: 'INLINE_TEMPLATE',
          content: this.config.requestMappingTemplate,
        },
        this.simulatorContext,
      );
    }
    return this.simulatorContext.getMappingTemplate(this.config.requestMappingTemplateLocation);
  }
}
