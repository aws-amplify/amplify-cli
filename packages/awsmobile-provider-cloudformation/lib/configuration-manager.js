/* eslint-disable */
function configure(context) {/* eslint-enable */
}

// function getConfiguration(context){
// }

/* eslint-disable */
function getConfiguration(context) {/* eslint-enable */
  const region = '<region>';
  const credential = {
    accessKeyId: '<accessKeyId>',
    secretAccessKey: '<secretAccessKey>',
  };
  return {
    accessKeyId: credential.accessKeyId,
    secretAccessKey: credential.secretAccessKey,
    region,
  };
}

module.exports = {
  configure,
  getConfiguration,
};
