/**
 * Drift detection module for Amplify CloudFormation stacks
 * Based on AWS CDK CLI drift detection implementation
 */

export { detectStackDrift, detectStackDriftRecursive, type CombinedDriftResults } from './detect-stack-drift';
export { DriftFormatter, type DriftDisplayFormat } from './services/drift-formatter';
