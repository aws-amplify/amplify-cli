const xrManager = require('./lib/xr-manager');

function console(context){
    return xrManager.console(context); 
}

module.exports = {
    console
};
  