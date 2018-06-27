const initializer = require('./lib/initializer');
const constants = require('./lib/constants'); 

function scanProject(context){
  return 100; 
}

function init(context) {
  return initializer.run(context);
}

function onInitSuccessful(context) {
  return initializer.onInitSuccessful(context);}

module.exports = {
  constants,
  scanProject,
  init,
  onInitSuccessful
};
