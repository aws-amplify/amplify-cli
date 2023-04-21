import axios from 'axios';

type ReportingWindow = 'last-7-days' | 'last-90-days' | 'last-24-hours' | 'last-30-days' | 'last-60-days';
export type CircleCIClientDefaults = {
  defaultBranch: string;
  defaultWorkflow: string;
  vcs: string;
  projectSlug: string;
  projectName: string;
};
export class CircleCIAPIClient {
  private headers;
  private options: CircleCIClientDefaults;
  private slug: string;
  constructor(token: string, options: CircleCIClientDefaults) {
    this.headers = {
      'Circle-Token': token,
    };
    this.options = options;
    this.slug = `${options.vcs}/${options.projectSlug}/${options.projectName}`;
  }

  /**
   * Returns a sequence of jobs for a workflow.
   *
   * https://circleci.com/docs/api/v2/index.html#operation/listWorkflowJobs
   * @returns
   */
  getWorkflowJobs = async (workflowId: string = this.options.defaultWorkflow) => {
    const result = await axios.get(`https://circleci.com/api/v2/workflow/${workflowId}/job`, {
      headers: this.headers,
    });
    return result.data;
  };
  /**
   * Returns a job's details.
   *
   * https://circleci.com/docs/api/v2/index.html#operation/getJobDetails
   * @param jobId
   * @returns
   */
  getJobDetails = async (jobId: string) => {
    const result = await axios.get(`https://circleci.com/api/v2/project/${this.slug}/job/${jobId}`, {
      headers: this.headers,
    });
    return result.data;
  };
  /**
   * Returns a single job's artifacts.
   *
   * https://circleci.com/docs/api/v2/index.html#operation/getJobArtifacts
   * @param jobId
   * @returns
   */
  getJobArtifacts = async (jobId: string) => {
    const result = await axios.get(`https://circleci.com/api/v2/project/${this.slug}/${jobId}/artifacts`, {
      headers: this.headers,
    });
    return result.data;
  };
  /**
   * Get test metadata for a single job
   *
   * https://circleci.com/docs/api/v2/index.html#operation/getTests
   * @param jobId
   * @returns
   */
  getJobTests = async (jobId: string) => {
    const result = await axios.get(`https://circleci.com/api/v2/project/${this.slug}/${jobId}/tests`, {
      headers: this.headers,
    });
    return result.data;
  };
  /**
   * Get summary metrics for a project workflow's jobs.
   *
   * https://circleci.com/docs/api/v2/index.html#operation/getProjectWorkflowJobMetrics
   *
   * @param workflowName
   * @param branch
   * @param reportingWindow
   * @returns
   */
  getAllJobMetrics = async (
    workflowName: string = this.options.defaultWorkflow,
    branch: string = this.options.defaultBranch,
    reportingWindow: ReportingWindow = 'last-30-days',
  ) => {
    const result = await axios.get(`https://circleci.com/api/v2/insights/${this.slug}/workflows/${workflowName}/jobs`, {
      headers: this.headers,
      params: {
        branch: branch,
        'reporting-window': reportingWindow,
      },
    });
    return result.data;
  };

  /**
   * Get test metrics for a project's workflows.
   *
   * https://circleci.com/docs/api/v2/index.html#operation/getProjectWorkflowTestMetrics
   * @param workflowName
   * @param branch
   * @param reportingWindow
   * @returns
   */
  getAllTestMetrics = async (workflowName: string = this.options.defaultWorkflow, branch: string = this.options.defaultBranch) => {
    const result = await axios.get(`https://circleci.com/api/v2/insights/${this.slug}/workflows/${workflowName}/test-metrics`, {
      headers: this.headers,
      params: {
        branch: branch,
      },
    });
    return result.data;
  };
}
