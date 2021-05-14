/**
 * @fileoverview
 *
 * This CloudFormation Trigger creates a Lambda function which waits for all
 * other specified Lambdas (modules) to resolve, which should be located in the
 * same directory as this file (./).
 */

/**
 * The names of modules to load are stored as a comma-delimited string in the
 * `MODULES` env variable.
 */
const moduleNames = process.env.MODULES.split(',');
/**
 * The array of imported modules.
 */
const modules = moduleNames.map(name => require(`./${name}`));

/**
 * This handler is itself a Lambda function which iterates over all of the given
 * modules and awaits them.
 *
 * @see https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html
 *
 * @param {object} event
 *
 * The event that triggered this Lambda.
 *
 * @param {object} context
 *
 * The context for this Lambda. See:
 * https://docs.aws.amazon.com/lambda/latest/dg/nodejs-context.html
 *
 * @param {function} callback
 *
 * A deprecated way to send a response synchronously. See:
 * https://docs.aws.amazon.com/lambda/latest/dg/nodejs-handler.html#nodejs-handler-sync
 *
 * @returns
 *
 * The CloudFormation trigger event.
 */
exports.handler = async (event, context, callback) => {
  /**
   * Instead of naively iterating over all handlers, run them concurrently with
   * `await Promise.all(...)`. This would otherwise just be determined by the
   * order of names in the `MODULES` var.
   */
  await Promise.all(modules.map(module => module.handler(event, context, callback)));
  return event;
};
