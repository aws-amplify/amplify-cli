import { CFNTemplate } from '../../cfn-template';

/**
 * Resolves DependsOn references in a CloudFormation template for a stack refactor.
 * Returns a new template; does not mutate input.
 *
 * When resources are being moved between stacks, DependsOn references that cross
 * the refactor boundary must be removed:
 * - Resources NOT being moved must not depend on resources being moved.
 * - Resources being moved must only depend on other resources being moved.
 */
export function resolveDependencies(template: CFNTemplate, resourcesToRefactor: string[]): CFNTemplate {
  const cloned = JSON.parse(JSON.stringify(template)) as CFNTemplate;

  for (const [logicalId, resource] of Object.entries(cloned.Resources)) {
    if (!resource.DependsOn) continue;

    const deps = Array.isArray(resource.DependsOn) ? resource.DependsOn : [resource.DependsOn];
    const depsInRefactor = deps.filter((dep) => resourcesToRefactor.includes(dep));
    const isBeingMoved = resourcesToRefactor.includes(logicalId);

    if (!isBeingMoved && depsInRefactor.length > 0) {
      // Resource stays — remove dependencies on resources being moved
      resource.DependsOn = deps.filter((dep) => !resourcesToRefactor.includes(dep));
    } else if (isBeingMoved && deps.length > depsInRefactor.length) {
      // Resource moves — keep only dependencies on other resources being moved
      resource.DependsOn = depsInRefactor;
    }
  }

  return cloned;
}
