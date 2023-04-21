import { getCCIClient, saveJobMetrics } from './cci-utils';

const runIt = async () => {
  const client = getCCIClient();
  console.log('Fetching job metrics...');
  const data = await client.getAllJobMetrics();
  saveJobMetrics(data);
};

function main(): void {
  runIt();
}
main();
