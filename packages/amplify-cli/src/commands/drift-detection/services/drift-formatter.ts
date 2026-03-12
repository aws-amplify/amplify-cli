/**
 * Drift formatter for output display
 * Processes and formats drift detection results for CloudFormation stacks
 * Each drifted resource is rendered as its own CATEGORY LogicalId block
 */

import type { StackResourceDrift, PropertyDifference } from '@aws-sdk/client-cloudformation';
import { StackResourceDriftStatus, ChangeAction } from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';
import { parseArn } from '@aws-amplify/amplify-cli-core';
import type { LocalDriftResults } from '../detect-local-drift';
import type { TemplateDriftResults, ResourceChangeWithNested } from '../detect-template-drift';
import { type StackDriftNode, type CloudFormationDriftResults } from '../detect-stack-drift';
import { extractCategory } from '../../gen2-migration/categories';

interface DriftBlock {
  categoryName: string;
  logicalId?: string;
  type: 'cf' | 'template' | 'local';
  cfDrift?: StackResourceDrift;
  driftDetectionId?: string;
  templateChange?: ResourceChangeWithNested;
  changeSetId?: string;
}

/**
 * Color a resource line based on its action/status symbol
 */
function colorResourceLine(symbol: string, line: string): string {
  if (symbol === '+') return chalk.green(line);
  if (symbol === '-') return chalk.red(line);
  if (symbol === '~') return chalk.yellow(line);
  return line;
}

/**
 * Get action symbol for changeset resource changes (Add/Remove/Modify)
 */
function getActionSymbol(action: ChangeAction | undefined): string {
  if (action === ChangeAction.Add) return '+';
  if (action === ChangeAction.Remove) return '-';
  return '~';
}

/**
 * Get the drift status symbol for CF drift resources
 */
function getCFDriftSymbol(status: StackResourceDriftStatus | undefined): string {
  if (status === StackResourceDriftStatus.MODIFIED) return '~';
  if (status === StackResourceDriftStatus.DELETED) return '-';
  return '?';
}

/**
 * Extract region from an ARN, returns undefined if parsing fails
 */
function regionFromArn(arn: string): string | undefined {
  try {
    return parseArn(arn).region || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Build CloudFormation console URL for a stack's drift page
 */
function cfnDriftConsoleUrl(stackArn: string): string | undefined {
  const region = regionFromArn(stackArn);
  if (!region) return undefined;
  return `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/drifts?stackId=${encodeURIComponent(
    stackArn,
  )}`;
}

/**
 * Build CloudFormation console URL for a changeset details page
 */
function cfnChangesetConsoleUrl(changeSetArn: string): string | undefined {
  const region = regionFromArn(changeSetArn);
  if (!region) return undefined;
  return `https://${region}.console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/changesets/details?changeSetId=${encodeURIComponent(
    changeSetArn,
  )}`;
}

/**
 * Flatten a StackDriftNode tree into a flat list (root + all descendants)
 */
function flattenTree(node: StackDriftNode, result: StackDriftNode[] = []): StackDriftNode[] {
  result.push(node);
  for (const child of node.children) flattenTree(child, result);
  return result;
}

/**
 * Collect drift blocks — one per drifted resource (CF/template) or per category (local)
 */
function collectDriftBlocks(phase1: CloudFormationDriftResults, phase2: TemplateDriftResults, phase3: LocalDriftResults): DriftBlock[] {
  const blocks: DriftBlock[] = [];

  // Phase 1: One block per CF drift resource
  for (const node of flattenTree(phase1.root)) {
    for (const drift of node.drifts) {
      blocks.push({
        categoryName: node.category,
        logicalId: drift.LogicalResourceId || 'Unknown',
        type: 'cf',
        cfDrift: drift,
        driftDetectionId: node.driftDetectionId,
      });
    }
  }

  // Phase 2: One block per template change (flatten nested stacks to leaf resources)
  if (!phase2.skipped && phase2.changes.length > 0) {
    const flattenChanges = (changes: ResourceChangeWithNested[], fallbackCategory: string, fallbackChangeSetId?: string): void => {
      for (const change of changes) {
        if (change.ResourceType === 'AWS::CloudFormation::Stack' && change.nestedChanges && change.nestedChanges.length > 0) {
          flattenChanges(change.nestedChanges, extractCategory(change.LogicalResourceId), change.ChangeSetId || fallbackChangeSetId);
        } else {
          const resourceCategory = extractCategory(change.LogicalResourceId);
          blocks.push({
            categoryName: resourceCategory !== 'Other' ? resourceCategory : fallbackCategory,
            logicalId: change.LogicalResourceId || 'Unknown',
            type: 'template',
            templateChange: change,
            changeSetId: change.ChangeSetId || fallbackChangeSetId,
          });
        }
      }
    };

    flattenChanges(phase2.changes, 'Other', phase2.changeSetId);
  }

  // Phase 3: One block per category (no logical ID)
  const localResources = [
    ...(phase3.resourcesToBeCreated || []),
    ...(phase3.resourcesToBeUpdated || []),
    ...(phase3.resourcesToBeDeleted || []),
    ...(phase3.resourcesToBeSynced || []),
  ];
  if (!phase3.skipped && localResources.length > 0) {
    const seenCategories = new Set<string>();

    for (const resource of localResources) {
      const categoryName = extractCategory(resource.category || resource.service || 'Other');
      if (!seenCategories.has(categoryName)) {
        seenCategories.add(categoryName);
        blocks.push({ categoryName, type: 'local' });
      }
    }
  }

  return blocks;
}

/**
 * Format property differences for CF drift resources
 */
function formatPropertyDiffs(differences: PropertyDifference[]): string {
  let output = '';
  for (const propDiff of differences) {
    output += `    Property: ${propDiff.PropertyPath}\n`;
    if (propDiff.ActualValue != null) {
      output += `      ${chalk.green(`Deployed:  "${propDiff.ActualValue}"`)}\n`;
    }
    if (propDiff.ExpectedValue != null) {
      output += `      ${chalk.red(`Expected:  "${propDiff.ExpectedValue}"`)}\n`;
    }
  }
  return output;
}

/**
 * Format a single drift block
 */
function formatBlock(block: DriftBlock): string {
  // Header: CATEGORY LogicalId (or just CATEGORY for local drift)
  const header = block.logicalId ? `${block.categoryName.toUpperCase()} ${block.logicalId}` : block.categoryName.toUpperCase();
  let output = chalk.bold(header) + '\n';

  if (block.type === 'cf') {
    const drift = block.cfDrift!;
    const symbol = getCFDriftSymbol(drift.StackResourceDriftStatus);
    const arn = drift.PhysicalResourceId || '';

    output += `  CloudFormation Drift: Deployed resources do not match templates\n`;
    if (block.driftDetectionId) {
      const stackArn = drift.StackId || '';
      const driftUrl = cfnDriftConsoleUrl(stackArn);
      output += `  Drift Id: ${driftUrl || block.driftDetectionId}\n`;
    }
    if (arn) {
      output += `\n  ${arn}\n`;
    }
    output += `  ${colorResourceLine(symbol, `${symbol} ${drift.ResourceType || 'Unknown'}`)}\n`;

    if (
      drift.StackResourceDriftStatus === StackResourceDriftStatus.MODIFIED &&
      drift.PropertyDifferences &&
      drift.PropertyDifferences.length > 0
    ) {
      output += formatPropertyDiffs(drift.PropertyDifferences);
    }
  } else if (block.type === 'template') {
    const change = block.templateChange!;
    const symbol = getActionSymbol(change.Action);

    output += `  Template Drift: S3 and deployed templates differ\n`;
    if (block.changeSetId) {
      const changesetUrl = cfnChangesetConsoleUrl(block.changeSetId);
      output += `  Changeset Id: ${changesetUrl || block.changeSetId}\n`;
    }
    output += `  ${colorResourceLine(symbol, `${symbol} ${change.ResourceType || 'Unknown'}`)}\n`;
  } else {
    output += `  Local Drift: Undeployed changes in this category\n`;
  }

  return output;
}

/**
 * Create unified category view — the main output function
 * Each drifted resource gets its own CATEGORY LogicalId block
 */
export function createUnifiedCategoryView(
  phase1: CloudFormationDriftResults,
  phase2: TemplateDriftResults,
  phase3: LocalDriftResults,
): string | undefined {
  const blocks = collectDriftBlocks(phase1, phase2, phase3);

  if (blocks.length === 0) {
    return undefined;
  }

  let output = '\n';
  for (const block of blocks) {
    output += formatBlock(block) + '\n';
  }

  return output;
}
