import { getCCIClient, saveWorkflowResults, saveWorkflowResultsHTML } from './cci-utils';

/**
 * This function runs after a CircleCI workflow has completed (build_test_deploy)
 * and aggretates the test results from the workflow into a single html/json file
 * that is easier to read. It eliminates the need to have to scan each individual
 * failed job.
 * Links to the job are provided, so you can just view the html file and
 * open failed jobs from there.
 */
const getWorkflowDataAndSummarizeResults = async () => {
  const client = getCCIClient();
  const data = await client.getWorkflowJobs(process.env.CIRCLE_WORKFLOW_ID);
  const failed = data.items.filter((i: any) => i.status === 'failed');
  const summary = [];
  for (let f of failed) {
    try {
      const jobData = await client.getJobDetails(f.job_number);
      // const artifacts = await getJobArtifacts(f.job_number);
      const tests = await client.getJobTests(f.job_number);
      summary.push({
        jobName: jobData.name,
        jobUrl: jobData.web_url,
        durationMins: Math.floor(jobData.duration / (60 * 1000)),
        // artifacts: artifacts.items.map((i: any) => i.url),
        failedTests: tests.items.filter((i: any) => i.result === 'failure'),
      });
    } catch (e) {
      console.log('Error fetching data for job:', f.name, e);
    }
  }
  saveWorkflowResults(summary);
  saveWorkflowResultsHTML(toHTML(summary));
};

const toHTML = (summary: any) => {
  const tableStart = `<!DOCTYPE html>
    <html><table border="1">`;
  const header = `<thead>
        <tr>
            <th>Job</th>
            <th>Failed Test Name</th>
            <th>Failed Test File</th>
        </tr>
    </thead>`;
  let body = '<tbody>';
  for (let r of summary) {
    let jobLink = `<a href='${r.jobUrl}'>${r.jobName} (${r.durationMins}mins)</>`;
    for (let f of r.failedTests) {
      let row = `
            <tr>
                <td>
                    <p>${jobLink}</p>
                    <p>${f.file}</p>
                </td>
                <td>${f.name}</td>
                <td>${f.message}</td>
            <tr>`;
      body = body + row;
    }
  }
  return tableStart + header + body + '</tbody>' + '</table></html>';
};

function main(): void {
  getWorkflowDataAndSummarizeResults();
}
main();
