/**
 * Drift detection module for Amplify CloudFormation stacks
 * Based on AWS CDK CLI drift detection implementation
 */

export { detectStackDrift } from './detect-stack-drift';
export { DriftFormatter, type DriftFormatterProps, type DriftFormatterOutput, type CloudFormationTemplate } from './drift-formatter';
