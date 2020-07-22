const enableMod = require('./enable');
const publshMod = require('./publish');
const initMod = require('./initEnv');
const serveMod = require('./serve');
const configureMod = require('./configure');

function enable(context) {
  enableMod.enable(context);
}

async function publish(context, doSkipBuild, doSkipPush) {
  await publshMod.publish(context, doSkipBuild, doSkipPush);
}

function initEnv(context) {
  initMod.initEnv(context);
}

async function serve(context) {
  await serveMod.serve(context);
}

async function configure(context) {
  await configureMod.configure(context);
}

module.exports = {
  enable,
  publish,
  initEnv,
  serve,
  configure,
};
