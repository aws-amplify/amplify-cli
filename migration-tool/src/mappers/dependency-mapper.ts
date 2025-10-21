import { AmplifyDependency } from '../types/cdk-types';
import { Gen2ResourceRefs } from '../types/gen2-types';

export interface ResourceDependency {
  sourceResource: string;
  targetResource: string;
  dependencyType: 'reference' | 'output' | 'attribute';
  property: string;
}

export interface CrossResourceReference {
  resourceName: string;
  property: string;
  accessPattern: string;
}

export interface DependencyMigrator {
  mapResourceDependencies(deps: ResourceDependency[]): Gen2ResourceRefs;
  resolveCrossResourceRefs(refs: CrossResourceReference[]): Gen2ResourceRefs;
  generateImportStatements(deps: AmplifyDependency[]): string[];
  orderDependencies(deps: ResourceDependency[]): ResourceDependency[];
}

export class DependencyMigratorImpl implements DependencyMigrator {
  mapResourceDependencies(deps: ResourceDependency[]): Gen2ResourceRefs {
    return deps.map((dep) => ({
      original: `${dep.sourceResource} -> ${dep.targetResource}`,
      gen2Import: `import { ${dep.targetResource} } from './${dep.targetResource}';`,
      reference: this.generateReferencePattern(dep),
    }));
  }

  resolveCrossResourceRefs(refs: CrossResourceReference[]): Gen2ResourceRefs {
    return refs.map((ref) => ({
      original: `${ref.resourceName}.${ref.property}`,
      gen2Import: `import { ${ref.resourceName} } from './${ref.resourceName}';`,
      reference: this.mapAccessPattern(ref),
    }));
  }

  generateImportStatements(deps: AmplifyDependency[]): string[] {
    const uniqueResources = new Set(deps.map((dep) => dep.resourceName));

    return Array.from(uniqueResources).map((resourceName) => `import { ${resourceName} } from './${resourceName}';`);
  }

  orderDependencies(deps: ResourceDependency[]): ResourceDependency[] {
    const graph = this.buildDependencyGraph(deps);
    return this.topologicalSort(graph);
  }

  private generateReferencePattern(dep: ResourceDependency): string {
    switch (dep.dependencyType) {
      case 'reference':
        return `${dep.targetResource}.${dep.property}`;

      case 'output':
        return `${dep.targetResource}.outputs.${dep.property}`;

      case 'attribute':
        return `${dep.targetResource}.${dep.property}`;

      default:
        return `${dep.targetResource}.${dep.property}`;
    }
  }

  private mapAccessPattern(ref: CrossResourceReference): string {
    const commonPatterns: Record<string, string> = {
      arn: `${ref.resourceName}.arn`,
      name: `${ref.resourceName}.name`,
      id: `${ref.resourceName}.id`,
      url: `${ref.resourceName}.url`,
      endpoint: `${ref.resourceName}.endpoint`,
      domainName: `${ref.resourceName}.domainName`,
      ref: `${ref.resourceName}.ref`,
    };

    return commonPatterns[ref.property] || `${ref.resourceName}.${ref.property}`;
  }

  private buildDependencyGraph(deps: ResourceDependency[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    deps.forEach((dep) => {
      if (!graph.has(dep.sourceResource)) {
        graph.set(dep.sourceResource, []);
      }
      graph.get(dep.sourceResource)!.push(dep.targetResource);
    });

    return graph;
  }

  private topologicalSort(graph: Map<string, string[]>): ResourceDependency[] {
    const visited = new Set<string>();
    const result: ResourceDependency[] = [];
    const temp = new Set<string>();

    const visit = (node: string) => {
      if (temp.has(node)) {
        throw new Error(`Circular dependency detected involving ${node}`);
      }

      if (!visited.has(node)) {
        temp.add(node);

        const dependencies = graph.get(node) || [];
        dependencies.forEach((dep) => visit(dep));

        temp.delete(node);
        visited.add(node);
      }
    };

    Array.from(graph.keys()).forEach((node) => {
      if (!visited.has(node)) {
        visit(node);
      }
    });

    return result;
  }
}
