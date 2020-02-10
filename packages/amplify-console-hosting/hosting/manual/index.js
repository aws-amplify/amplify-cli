const enableMod = require('./enable');
const publshMod = require('./publish');

function enable(context) {
    enableMod.enable(context);
}

async function publish(context) {
    publshMod.publish(context);
}

module.exports = {
    enable,
    publish
};