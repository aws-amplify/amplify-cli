const fs = require('fs');

/**
 * Runs a series of jobs through the templating system.
 *
 * @param {any}   context        - The Amplify CLI context
 * @param {any[]} jobs           - A list of jobs to run.
 * @param {any}   props          - The props to use for variable replacement.
 * @param {any}   opts           - Additional options
 */
async function copyBatch(context, jobs, props, force, writeParams, privateKeys, privateParams) {
  // grab some features
  const {
    template,
    prompt,
    filesystem,
  } = context;
  const {
    confirm,
  } = prompt;

  // If the file exists
  const shouldGenerate = async (target) => {
    if (!filesystem.exists(target) || force) return true;
    return await confirm(`overwrite ${target}`);
  };

  // TODO replace usages of privateKeys with privateParams
  // deleting private keys from shared params before they are written to parameters.json
  if (privateKeys && privateKeys.length > 0) {
    // deleting private keys from shared params before they are written to parameters.json
    privateKeys.forEach((e) => {
      if (props[e]) {
        delete props[e];
      }
    });
  }

  for (let index = 0; index < jobs.length; index += 1) {
    // grab the current job
    const job = jobs[index];
    // safety check
    if (!job) {
      continue;
    }

    // key/value pairs that are needed for CFN generation but NOT for parameters.json file
    // can be passed as "privateParams"
    const params = privateParams && typeof privateParams === 'object' ? privateParams : props;

    // generate the React component
    // TODO: Error handling in event of single file write failure
    if (await shouldGenerate(job.target, force)) {
      template.generate({
        directory: job.dir,
        template: job.template,
        target: job.target,
        props: params,
      });


      if (writeParams && job.paramsFile) {
        const jsonString = JSON.stringify(props, null, 4);
        fs.writeFileSync(job.paramsFile, jsonString, 'utf8');
      }
    }
  }
}


module.exports = {
  copyBatch,
};
