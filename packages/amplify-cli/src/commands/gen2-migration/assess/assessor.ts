import { Assessment } from './assessment';

/**
 * Evaluates migration readiness for a single discovered resource.
 * Each assessor records resource-level and feature-level support.
 */
export interface Assessor {
  record(assessment: Assessment): void;
}
