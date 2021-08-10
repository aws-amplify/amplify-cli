const fs = require('fs');

const readParams = () => {
  const stdin = fs.readFileSync(0, {encoding: 'utf8'});
  return JSON.parse(stdin);
}

/**
 * comment that describes the shape of the params
 * @param event
 */
const hookHandler = async (event) => {
  // TODO replace the contents of this function with your custom logic
  console.log("project root path:", process.cwd());
  console.log("Amplify CLI command:", event.amplify.command);
}

/**
 * commend that describes the shape of the err
 * @param err
 */
const cliErrorHandler = async (err) => {
  // TODO replace the contents of this function with your CLI error handling logic
  // this function can be a noop if you do not want to run custom logic in the case of a CLI error
  console.log(`Amplify CLI emitted an error: ${err.message}`);
}

const driver = async () => {
  const params = readParams();
  if (params.error) {
    await cliErrorHandler(params.error);
  } else {
    await hookHandler(params.data);
  }
}

driver().catch(err => {
  console.error(`Hook script failed. Error was:`);
  console.error(err);
  process.exitCode = 1;
});


/**
 * This is a sample hooks script created by Amplify CLI.
 * To start using this pre-push hook please change the filename:
 * pre-push.js.sample  ->  pre-push.js
 *
 * learn more: https://docs.amplify.aws/cli/usage/runtime-hooks
 *
 * @param event describe shape of event
 */
const hookHandler = async (event) => {
  // TODO write your hook handler here
}

const getParameters = async () => {
  const fs = require("fs");
  return JSON.parse(fs.readFileSync(0, {encoding: 'utf8'}));
};

getParameters()
  .then(hookHandler)
  .catch((err) => {
    console.error(err);
    process.exitCode = 1
  });