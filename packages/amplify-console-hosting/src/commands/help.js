import { runHelp, commandsInfo } from '@aws-amplify/amplify-cli-core';

async function run(context) {
  runHelp(context, commandsInfo);
}

module.exports = {
  run,
};
