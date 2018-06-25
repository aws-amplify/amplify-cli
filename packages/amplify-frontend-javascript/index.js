const initializer = require('./lib/initializer');

function scanProject(context){
  return 100; 
}

function init(context) {
  return initializer.run(context);
}

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);}

module.exports = {
  scanProject,
  init,
  onInitSuccessful
};
