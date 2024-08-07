const hostingModule = require('../hosting/index');

async function run(context) {
  try {
    await hostingModule.publish(context, false, false);
  } catch (err) {
    if (err?.name === 'ValidationError') {
      context.print.error(err.message);
    } else {
      throw err;
    }
  }
}

module.exports = {
  run,
};
