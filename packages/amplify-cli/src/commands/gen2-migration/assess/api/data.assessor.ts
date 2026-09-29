import { Assessor } from '../assessor';
import { Assessment, supported, unsupported, notApplicable } from '../assessment';
import { Gen1App, DiscoveredResource, KNOWN_FEATURES } from '../../_common/gen1-app';
import { FeatureFlags } from '@aws-amplify/amplify-cli-core';

/**
 * Assesses migration readiness for an AppSync GraphQL API resource.
 * Rejects Transformer V1 projects, detects overrides.ts usage and conflict resolution (DataStore).
 */
export class DataAssessor implements Assessor {
  public constructor(private readonly gen1App: Gen1App, private readonly resource: DiscoveredResource) {}

  /**
   * Records resource-level and feature-level support for this API resource.
   */
  public record(assessment: Assessment): void {
    this.gen1App.ensureCliInputs(this.resource.category, this.resource.resourceName);

    const transformerVersion = FeatureFlags.getNumber('graphQLTransformer.transformerVersion');
    if (transformerVersion !== 2) {
      assessment.recordResource({
        resource: this.resource,
        generate: unsupported('Transformer V1 is not supported in Gen2'),
        refactor: notApplicable(),
      });
    } else {
      assessment.recordResource({ resource: this.resource, generate: supported(), refactor: notApplicable() });
    }

    const overridesPath = `api/${this.resource.resourceName}/override.ts`;

    if (this.gen1App.fileExists(overridesPath)) {
      assessment.recordFeature({
        feature: { name: KNOWN_FEATURES.OVERRIDES, path: overridesPath },
        generate: unsupported('requires adding code after generate'),
        refactor: notApplicable(),
      });
    }

    if (this.hasConflictResolution()) {
      const cliInputsPath = `api/${this.resource.resourceName}/cli-inputs.json`;
      assessment.recordFeature({
        feature: { name: KNOWN_FEATURES.CONFLICT_RESOLUTION, path: cliInputsPath },
        generate: unsupported('conflict resolution (DataStore) is not supported in Gen2'),
        refactor: unsupported('conflict resolution (DataStore) is not supported in Gen2'),
      });
    }
  }

  /**
   * Returns true if the API has non-empty conflict resolution configuration in cli-inputs.json (indicates DataStore usage).
   */
  private hasConflictResolution(): boolean {
    const cliInputs = this.gen1App.cliInputs(this.resource.category, this.resource.resourceName);
    const conflictResolution = cliInputs?.serviceConfiguration?.conflictResolution;
    return (
      conflictResolution != null &&
      typeof conflictResolution === 'object' &&
      !Array.isArray(conflictResolution) &&
      Object.keys(conflictResolution).length > 0
    );
  }
}
