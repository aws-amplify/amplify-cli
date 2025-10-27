/**
 * Drift detection module for Amplify CloudFormation stacks
 * Based on AWS CDK CLI drift detection implementation
 */

export { detectStackDrift, detectStackDriftRecursive, type CombinedDriftResults } from './detect-stack-drift';
export {
  ConsolidatedDriftFormatter,
  type ConsolidatedDriftResults,
  type ConsolidatedDriftOutput,
  type DriftDisplayFormat,
  type CloudFormationTemplate,
} from './consolidated-drift-formatter';
