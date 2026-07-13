import { Teardown } from '../packages/amplify-e2e-gen2-migration/src/core/teardown';
import { fromIni } from '@aws-sdk/credential-providers';

const deploymentName = process.argv[2];
const profile = process.argv[3];

if (!deploymentName || !profile) {
  console.error('Usage: npx tsx teardown.ts <deploymentName> <profile>');
  process.exit(1);
}

new Teardown(deploymentName, { credentials: fromIni({ profile }) }).clean().catch((e: Error) => {
  console.error(e.message);
  process.exit(1);
});
