const constants = require('../constants');

function normalizeInputParams(context) {
    let inputParams;
     context.exeInfo = context.exeInfo || {};
    if (context.exeInfo.inputParams) {
      if (context.exeInfo.inputParams[constants.Label]) {
        inputParams = context.exeInfo.inputParams[constants.Label];
      } else {
        for (let i = 0; i < constants.Aliases.length; i++) {
          const alias = constants.Aliases[i];
          if (context.exeInfo.inputParams[alias]) {
            inputParams = context.exeInfo.inputParams[alias];
            break;
          }
        }
      }
    }
    if (inputParams) {
      context.exeInfo.inputParams[constants.Label] = inputParams;
    }
}

module.exports = {
    normalizeInputParams
}