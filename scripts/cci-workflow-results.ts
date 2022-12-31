import { join } from "path";
import { getOldJobNameWithoutSuffixes, getTestFiles, getTimingsFromJobsData, REPO_ROOT, saveTestTimings, saveWorkflowResults, saveWorkflowResultsHTML } from "./cci-utils";
import axios from 'axios';

const getWorkflowData = async () => {
    const result = await axios.get(`https://circleci.com/api/v2/workflow/${process.env.CIRCLE_WORKFLOW_ID}/job`, {
        headers: {
            "Circle-Token": process.env.CIRCLECI_TOKEN 
        }
    });
    return result.data;
}
const getJobData = async (jobId: string) => {
    const result = await axios.get(`https://circleci.com/api/v2/project/github/aws-amplify/amplify-cli/job/${jobId}`, {
        headers: {
            "Circle-Token": process.env.CIRCLECI_TOKEN 
        }
    });
    return result.data;
}
const getJobArtifacts = async (jobId: string) => {
    const result = await axios.get(`https://circleci.com/api/v2/project/github/aws-amplify/amplify-cli/${jobId}/artifacts`, {
        headers: {
            "Circle-Token": process.env.CIRCLECI_TOKEN 
        }
    });
    return result.data;
}
const getJobTests = async (jobId: string) => {
    const result = await axios.get(`https://circleci.com/api/v2/project/github/aws-amplify/amplify-cli/${jobId}/tests`, {
        headers: {
            "Circle-Token": process.env.CIRCLECI_TOKEN 
        }
    });
    return result.data;
}


const runit = async () => {
    const data = await getWorkflowData();
    const failed = data.items.filter((i: any) => i.status === 'failed');
    const summary = [];
    for(let f of failed){
        try {
            const jobData = await getJobData(f.job_number);
            // const artifacts = await getJobArtifacts(f.job_number);
            const tests = await getJobTests(f.job_number);
            summary.push({
                jobName: jobData.name,
                jobUrl: jobData.web_url,
                durationMins: Math.floor(jobData.duration / (60 * 1000)),
                // artifacts: artifacts.items.map((i: any) => i.url),
                failedTests: tests.items.filter((i: any) => i.result === 'failure')
            });
        } catch(e){
            console.log('Error fetching data for job:', f.name, e);
        }
    }
    saveWorkflowResults(summary);
    saveWorkflowResultsHTML(toHTML(summary));
}

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
    for(let r of summary){
        let jobLink = `<a href='${r.jobUrl}'>${r.jobName} (${r.durationMins}mins)</>`;
        for(let f of r.failedTests){
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
}

function main(): void {
    runit();
}
main();