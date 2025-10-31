/**
 * Resource counter utility
 * Shared utility for counting resources by drift status
 */

import { StackResourceDriftStatus } from '@aws-sdk/client-cloudformation';
import type { StackResourceDrift } from '@aws-sdk/client-cloudformation';
import type { CloudFormationTemplate } from './drift-formatter';

/**
 * Utility class for counting resources by status
 * Shared between drift.ts and ConsolidatedDriftFormatter
 */
export class ResourceCounter {
  /**
   * Generic method to count resources by status
   */
  public static countResourcesByStatus(drifts: StackResourceDrift[], ...statuses: StackResourceDriftStatus[]): number {
    return drifts.filter((d) => statuses.includes(d.StackResourceDriftStatus!)).length;
  }

  /**
   * Count drifted resources (MODIFIED or DELETED)
   */
  public static countDriftedResources(drifts: StackResourceDrift[]): number {
    return this.countResourcesByStatus(drifts, StackResourceDriftStatus.MODIFIED, StackResourceDriftStatus.DELETED);
  }

  /**
   * Count resources in sync
   */
  public static countInSyncResources(drifts: StackResourceDrift[]): number {
    return this.countResourcesByStatus(drifts, StackResourceDriftStatus.IN_SYNC);
  }

  /**
   * Count unchecked resources (NOT_CHECKED status + resources not in drift results)
   */
  public static countUncheckedResources(drifts: StackResourceDrift[], template: CloudFormationTemplate): number {
    // Count resources not in drift results
    const checkedResourceIds = new Set(drifts.map((d) => d.LogicalResourceId));
    const allResourceIds = Object.keys(template.Resources || {});
    const notInResults = allResourceIds.filter((id) => !checkedResourceIds.has(id)).length;

    // Count resources with NOT_CHECKED status
    const notChecked = this.countResourcesByStatus(drifts, StackResourceDriftStatus.NOT_CHECKED);

    return notInResults + notChecked;
  }

  /**
   * Count failed resources (UNKNOWN status - drift check failed)
   */
  public static countFailedResources(drifts: StackResourceDrift[]): number {
    return this.countResourcesByStatus(drifts, StackResourceDriftStatus.UNKNOWN);
  }

  /**
   * Get drifted resources (MODIFIED or DELETED)
   */
  public static getDriftedResources(drifts: StackResourceDrift[]): StackResourceDrift[] {
    return drifts.filter(
      (d) =>
        d.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED || d.StackResourceDriftStatus === StackResourceDriftStatus.DELETED,
    );
  }
}
