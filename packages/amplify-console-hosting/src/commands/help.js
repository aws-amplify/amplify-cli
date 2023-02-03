import { runHelp, commandsInfo } from 'amplify-cli-core';

async function run(context) {
  runHelp(context, commandsInfo);
}

module.exports = {
  run,
};
