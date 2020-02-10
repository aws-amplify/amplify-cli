const enableMod = require('./enable');
const publshMod = require('./publish');

async function enable(context) {
    await enableMod.enable(context);
}

async function publish(context) {
    await publshMod.publish(context);
}

module.exports = {
    enable,
    publish
};