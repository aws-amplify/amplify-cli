import { CFNTemplate } from '../../_common/cfn-template';

/**
 * Strips all DependsOn references from a CloudFormation template.
 * DependsOn only controls deployment ordering, which is irrelevant during
 * refactor since all resources already exist. Removing them avoids
 * cross-boundary issues when resources move between stacks.
 */
export function resolveDependencies(template: CFNTemplate): CFNTemplate {
  const cloned = JSON.parse(JSON.stringify(template)) as CFNTemplate;

  for (const resource of Object.values(cloned.Resources)) {
    delete resource.DependsOn;
  }

  return cloned;
}
