import { CFNTemplate } from '../types';

class CfnDependencyResolver {
  constructor(private readonly template: CFNTemplate) {}

  public resolve(resourcesToRefactor: string[]) {
    const clonedGen1Template = JSON.parse(JSON.stringify(this.template)) as CFNTemplate;
    const resources = clonedGen1Template.Resources;
    Object.entries(resources).forEach(([logicalResourceId, resource]) => {
      if (resource?.DependsOn) {
        const deps = resource.DependsOn;
        const depsInRefactor = deps.filter((dep: string) => resourcesToRefactor.includes(dep));
        // If resource is not part of refactor, it should not depend on any resource being moved as part of refactor.
        if (depsInRefactor.length > 0 && !resourcesToRefactor.includes(logicalResourceId)) {
          resource.DependsOn = deps.filter((dep: string) => !resourcesToRefactor.includes(dep));
        }
        // If resource is part of refactor, it should only depend on resources being moved as part of refactor.
        else if (resourcesToRefactor.includes(logicalResourceId) && deps.length > depsInRefactor.length) {
          resource.DependsOn = depsInRefactor;
        }
      }
    });
    return clonedGen1Template;
  }
}

export default CfnDependencyResolver;
