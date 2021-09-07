import { IAmplifyResource, AmplifyCategoryTransform, $TSContext, Template } from 'amplify-cli-core';

const categoryCfnTransformMap = (resourceName: string) => ({
  /**
  * auth: {
    Cognito: new AmplifyAuthTransform(resourceName)
  }
   *  add Factories here for overrides
   */
  default: {
    service: new AmplifyNoneTransform(resourceName),
  },
});

export class AmplifyCategoryTransformFactory {
  public static getCategoryTransformInstance(resource: IAmplifyResource): AmplifyCategoryTransform {
    return categoryCfnTransformMap(resource.resourceName)[resource.category][resource.service];
  }
}

export class AmplifyNoneTransform extends AmplifyCategoryTransform {
  transform(context: $TSContext): Promise<Template> {
    throw new Error('Method not implemented.');
  }
  applyOverride(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  saveBuildFiles(context: $TSContext, template: Template): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
