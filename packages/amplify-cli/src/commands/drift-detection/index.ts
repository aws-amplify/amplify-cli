/**
 * Drift detection module for Amplify CloudFormation stacks
 * Based on AWS CDK CLI drift detection implementation
 */

export { detectStackDrift, detectStackDriftRecursive, type CloudFormationDriftResults } from './detect-stack-drift';
export { detectLocalDrift, type LocalDriftResults, type ResourceInfo } from './detect-local-drift';
export { detectTemplateDrift, type TemplateDriftResults } from './detect-template-drift';
export { type DriftDisplayFormat, formatDriftResults } from './services/drift-formatter';
