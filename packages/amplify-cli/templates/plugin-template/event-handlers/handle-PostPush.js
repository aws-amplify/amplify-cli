const eventName = 'PostPush';

async function run(context, args) {
  // insert your code to handle the amplify cli PostPush event
  context.print.info(`Event handler ${eventName} to be implemented.`);
}

module.exports = {
  run,
};
