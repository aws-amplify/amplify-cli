import { $TSContext, $TSCopyJob, JSONUtilities } from 'amplify-cli-core';

/**
 * @param context The Amplify CLI context
 * @param jobs A list of jobs to run
 * @param props Mapping of replacements to make in the templates
 * @param force Force template generation
 * @param writeParams boolean of whether props should be written to job.paramsFile, or an object that should be written to job.paramsFile
 */
export async function copyBatch(context: $TSContext, jobs: $TSCopyJob, props: object, force?: boolean, writeParams?: boolean | object) {
  // grab some features
  const { template, prompt, filesystem } = context;
  const { confirm } = prompt;

  // If the file exists
  const shouldGenerate = async (target: string, force?: boolean) => {
    if (!filesystem.exists(target) || force) return true;
    return confirm(`overwrite ${target}`);
  };

  for (const job of jobs) {
    // safety check
    if (!job) {
      continue;
    }

    // generate the React component
    // TODO: Error handling in event of single file write failure
    if (await shouldGenerate(job.target, force)) {
      await template.generate({
        directory: job.dir,
        template: job.template,
        target: job.target,
        props,
      });

      if (writeParams && job.paramsFile) {
        const params = writeParams && Object.keys(writeParams) && Object.keys(writeParams).length > 0 ? writeParams : props;

        JSONUtilities.writeJson(job.paramsFile, params);
      }
    }
  }
}
