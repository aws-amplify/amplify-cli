#!/usr/bin/env ts-node

/**
 * Check Dependabot Alerts
 *
 * This script fetches and displays Dependabot security alerts for the repository.
 * Requires GitHub CLI (gh) to be installed and authenticated.
 *
 * Usage:
 *   npx ts-node scripts/check-dependabot.ts
 */

import { execSync } from 'child_process';

interface DependabotAlert {
  number: number;
  state: string;
  dependency: {
    package: {
      name: string;
      ecosystem: string;
    };
  };
  security_advisory: {
    severity: string;
    summary: string;
    description: string;
    ghsa_id: string;
    cve_id?: string;
  };
  security_vulnerability: {
    vulnerable_version_range: string;
    first_patched_version?: {
      identifier: string;
    };
  };
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

const checkGhInstalled = (): boolean => {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const checkGhAuth = (): boolean => {
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const fetchDependabotAlerts = (): DependabotAlert[] => {
  try {
    const output = execSync('gh api repos/aws-amplify/amplify-cli/dependabot/alerts --paginate', {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return JSON.parse(output);
  } catch (error: any) {
    console.error('❌ Failed to fetch Dependabot alerts:', error.message);
    return [];
  }
};

const groupAlertsBySeverity = (alerts: DependabotAlert[]): Map<string, DependabotAlert[]> => {
  const grouped = new Map<string, DependabotAlert[]>();
  const severityOrder = ['critical', 'high', 'medium', 'low'];

  for (const severity of severityOrder) {
    grouped.set(severity, []);
  }

  for (const alert of alerts) {
    const severity = alert.security_advisory.severity.toLowerCase();
    if (grouped.has(severity)) {
      grouped.get(severity)!.push(alert);
    }
  }

  return grouped;
};

const printAlertSummary = (alerts: DependabotAlert[]): void => {
  const openAlerts = alerts.filter((a) => a.state === 'open');
  const grouped = groupAlertsBySeverity(openAlerts);

  console.log('\n=== Dependabot Alert Summary ===\n');
  console.log(`Total Open Alerts: ${openAlerts.length}`);
  console.log(`Total Closed Alerts: ${alerts.filter((a) => a.state !== 'open').length}\n`);

  console.log('By Severity:');
  for (const [severity, severityAlerts] of grouped) {
    if (severityAlerts.length > 0) {
      const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '🟢';
      console.log(`  ${icon} ${severity.toUpperCase()}: ${severityAlerts.length}`);
    }
  }

  console.log('\n=== Alert Details ===\n');

  for (const [severity, severityAlerts] of grouped) {
    if (severityAlerts.length === 0) continue;

    const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '🟢';
    console.log(`\n${icon} ${severity.toUpperCase()} Severity (${severityAlerts.length} alerts):\n`);

    for (const alert of severityAlerts) {
      console.log(`Alert #${alert.number}: ${alert.security_advisory.summary}`);
      console.log(`  Package: ${alert.dependency.package.name} (${alert.dependency.package.ecosystem})`);
      console.log(`  Vulnerable: ${alert.security_vulnerability.vulnerable_version_range}`);
      if (alert.security_vulnerability.first_patched_version) {
        console.log(`  Patched: ${alert.security_vulnerability.first_patched_version.identifier}`);
      } else {
        console.log(`  Patched: No patch available yet`);
      }
      if (alert.security_advisory.cve_id) {
        console.log(`  CVE: ${alert.security_advisory.cve_id}`);
      }
      console.log(`  GHSA: ${alert.security_advisory.ghsa_id}`);
      console.log(`  URL: ${alert.html_url}`);
      console.log('');
    }
  }

  if (openAlerts.length === 0) {
    console.log('✅ No open Dependabot alerts found!\n');
  }
};

const main = (): void => {
  console.log('🔍 Checking Dependabot alerts...\n');

  // Check prerequisites
  if (!checkGhInstalled()) {
    console.error('❌ GitHub CLI (gh) is not installed.');
    console.error('\nInstall instructions:');
    console.error('  macOS:   brew install gh');
    console.error('  Windows: winget install GitHub.cli');
    console.error('  Linux:   https://github.com/cli/cli#installation');
    process.exit(1);
  }

  if (!checkGhAuth()) {
    console.error('❌ GitHub CLI is not authenticated.');
    console.error('\nRun: gh auth login');
    process.exit(1);
  }

  // Fetch and display alerts
  const alerts = fetchDependabotAlerts();

  if (alerts.length === 0) {
    console.log('✅ No Dependabot alerts found (or failed to fetch).\n');
    return;
  }

  printAlertSummary(alerts);
};

if (require.main === module) {
  main();
}
