/**
 * Drift detection module for Amplify CloudFormation stacks
 * Based on AWS CDK CLI drift detection implementation
 */

export { detectStackDrift, detectStackDriftRecursive, type CombinedDriftResults } from './detect-stack-drift';
// Note: detectLocalDrift now requires a context parameter
export { detectLocalDrift, type Phase3Results, type ResourceInfo } from './detect-local-drift';
export { DriftFormatter, type DriftDisplayFormat } from './services/drift-formatter';
