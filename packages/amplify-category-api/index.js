const { run } = require('./commands/api/console');


async function console(context) {
  await run(context);
}

module.exports = {
  console,
};
