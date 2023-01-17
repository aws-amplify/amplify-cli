import { getCCIClient, saveJobMetrics } from './cci-utils';

const runIt = async () => {
  const client = getCCIClient();
  const data = await client.getAllTestMetrics();
  saveJobMetrics(data);
};

function main(): void {
  runIt();
}
main();
