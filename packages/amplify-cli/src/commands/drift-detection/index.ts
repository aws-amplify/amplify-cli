/**
 * Drift detection module for Amplify CloudFormation stacks
 * Based on AWS CDK CLI drift detection implementation
 */

export {
  detectStackDrift,
  detectStackDriftRecursive,
  type CloudFormationDriftResults,
  type StackDriftNode,
  type ResourceCounts,
  type DriftSummary,
  countDrifted,
  countInSync,
  countUnchecked,
  countFailed,
} from './detect-stack-drift';
export { detectLocalDrift, type LocalDriftResults, type ResourceInfo } from './detect-local-drift';
export { detectTemplateDrift, type TemplateDriftResults, type ResourceChangeWithNested } from './detect-template-drift';
