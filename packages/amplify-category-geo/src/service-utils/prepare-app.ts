/**
 * This function is taken from : https://github.com/aws/aws-cdk/blob/cea1039e3664fdfa89c6f00cdaeb1a0185a12678/packages/%40aws-cdk/core/lib/private/prepare-app.ts#L17
 * In cdkV2 this function is not exported by the library. This function is copied from above to get previous behavior as an effort of
 * migrating amplify-cli from CDK V1 to CDK V2.
 *
 * Since we cant import it (method as private in cdkV2) and when removing this function result in undesired behavior where cfn
 * template for geo were missing dependsOn attributes causing deployment failures for those templates.
 *
 * This file should remain untouched and should not import any dependencies
 * Moving forward Geo category should utilize cdk.App object for template synthesis.
 */

import { IConstruct, Dependable } from 'constructs';
import { CfnResource } from 'aws-cdk-lib';

/**
 * Prepares the app for synthesis. This function is called by the root `prepare`
 * (normally this the App, but if a Stack is a root, it is called by the stack),
 * which means it's the last 'prepare' that executes.
 * It takes care of reunifying cross-references between stacks (or nested stacks),
 * and of creating assets for nested stack templates.
 * @deprecated Use cdk.App and app.synth() for template Synthesis
 */
export const cdkV1PrepareAppShim = (root: IConstruct): void => {
  // apply dependencies between resources in depending sub trees
  for (const dependency of findTransitiveDeps(root)) {
    const targetCfnResources = findCfnResources(dependency.target);
    const sourceCfnResources = findCfnResources(dependency.source);

    for (const target of targetCfnResources) {
      for (const source of sourceCfnResources) {
        source.addDependsOn(target);
      }
    }
  }
};

/**
 * Find all resources in a set of constructs
 */
const findCfnResources = (root: IConstruct): CfnResource[] => root.node.findAll().filter(CfnResource.isCfnResource);

/**
 * Return all dependencies registered on this node or any of its children
 */
const findTransitiveDeps = (root: IConstruct): Dependency[] => {
  const found = new Map<IConstruct, Set<IConstruct>>();
  const ret = new Array<Dependency>();

  for (const source of root.node.findAll()) {
    for (const dependable of source.node.dependencies) {
      for (const target of Dependable.of(dependable).dependencyRoots) {
        let foundTargets = found.get(source);
        if (!foundTargets) { found.set(source, foundTargets = new Set()); }

        if (!foundTargets.has(target)) {
          ret.push({ source, target });
          foundTargets.add(target);
        }
      }
    }
  }

  return ret;
};

interface Dependency {
  readonly source: IConstruct;
  readonly target: IConstruct;
}
