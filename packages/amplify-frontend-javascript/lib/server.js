const builder = require('./builder'); 

function run(context) {
    return builder.run(context)
    .then(runAppLocally);
}

function runAppLocally(context){
    return context;
}

module.exports = {
    run
};
