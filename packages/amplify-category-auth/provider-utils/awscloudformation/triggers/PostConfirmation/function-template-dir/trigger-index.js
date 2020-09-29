/*
  this file will loop through all js modules which are uploaded to the lambda resource,
  provided that the file names (without extension) are included in the "MODULES" env variable.
  "MODULES" is a comma-delimmited string.
*/
const moduleNames = process.env.MODULES.split(',');
const modules = [];
for (let i = 0; i < moduleNames.length; i += 1) {
  modules.push(require(`./${moduleNames[i]}`));
}

exports.handler = (event, context, callback) => {
  for (let i = 0; i < modules.length; i += 1) {
    const { handler } = modules[i];
    handler(event, context, callback);
  }
};
