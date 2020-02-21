const enableMod = require('./enable');
const publshMod = require('./publish');
const initMod = require('./initEnv');
const consoleMod = require('./console');
const configureMod = require('./configure');

async function enable(context) {
  await enableMod.enable(context);
}

async function publish(context) {
  await publshMod.publish(context);
}

function initEnv(context) {
  initMod.initEnv(context);
}

async function console(context) {
  await consoleMod.console(context);
}

async function configure(context) {
  await configureMod.configure(context);
}

module.exports = {
  enable,
  publish,
  initEnv,
  console,
  configure,
};
