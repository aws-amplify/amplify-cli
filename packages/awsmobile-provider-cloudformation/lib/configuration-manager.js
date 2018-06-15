/* eslint-disable */
function configure(context) {/* eslint-enable */
}

// function getConfiguration(context){
// }

/* eslint-disable */
function getConfiguration(context) {/* eslint-enable */
  const region = 'us-east-1';
  const credential = {
    accessKeyId: 'AKIAI5LD6XA6YBWCTR2Q',
    secretAccessKey: '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',
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
