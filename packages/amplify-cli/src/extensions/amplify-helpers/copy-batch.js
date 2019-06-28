const fs = require('fs');

/**
 * Runs a series of jobs through the templating system.
 *
 * @param {any}             context        - The Amplify CLI context
 * @param {any[]}           jobs           - A list of jobs to run.
 * @param {any}             props          - The props to use for variable replacement.
 * @param {boolean}         force          - Force CF template generation
 * @param {array|object}    privateKeys    - data for the CF template but not parameters file
 */
async function copyBatch(context, jobs, props, force, writeParams, privateKeys) {
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

  let params = Object.assign({}, props);

  // TODO replace usages of privateKeys with privateParams
  // deleting private keys from shared params before they are written to parameters.json
  if (privateKeys && Array.isArray(privateKeys) && privateKeys.length > 0) {
    // deleting private keys from shared params before they are written to parameters.json
    privateKeys.forEach((e) => {
      if (params[e]) {
        delete params[e];
      }
    });
  } else if (privateKeys && !Array.isArray(privateKeys)) {
    params = Object.assign({}, writeParams);
  }

  for (let index = 0; index < jobs.length; index += 1) {
    // grab the current job
    const job = jobs[index];
    // safety check
    if (!job) {
      continue;
    }


    // generate the React component
    // TODO: Error handling in event of single file write failure
    if (await shouldGenerate(job.target, force)) {
      template.generate({
        directory: job.dir,
        template: job.template,
        target: job.target,
        props,
      });


      if (writeParams && job.paramsFile) {
        const jsonString = JSON.stringify(params, null, 4);
        fs.writeFileSync(job.paramsFile, jsonString, 'utf8');
      }
    }
  }
}


module.exports = {
  copyBatch,
};
