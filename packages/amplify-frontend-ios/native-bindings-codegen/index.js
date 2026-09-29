const path = require('path');
const fs = require('fs');
const _ = require('lodash');

const CODEGEN_TEMPLATES_FOLDER = 'templates';

const canonicalFunctionName = (commandName) => _.camelCase(commandName);

const getTemplate = (templateName) => {
  const templatePath = path.join(__dirname, CODEGEN_TEMPLATES_FOLDER, templateName);
  const template = fs.readFileSync(templatePath).toString();
  return _.template(template, { interpolate: /<%=([\s\S]+?)%>/g });
};

/**
 * Generates function signature docs
 * @param {String} abstract
 * @param {Array<{name: String, type: String, help: String}>} parameters
 */
const generateFunctionDocs = (abstract, parameters) => {
  return `
/**
 * ${abstract}
 * @param {Object} params
${parameters.map((p) => ` * @param {${p.type}} params.${p.name} - ${p.help}`).join('\n')}
 */`;
};

/**
 * Given a list of parameters of type `Parameter` generates
 * proper CLI call signature.
 * Parameter {
 *  kind: option | flag | argument
 *  name: string
 *  type: string
 *  help: string
 * }
 * @param {Array<{
 *    name: String,
 *    kind:"option" | "flag" | "argument"
 *    type: String,
 *    help: String}>} parameters
 * @returns {Array<Array<String>>}
 */
const generateCommandParameters = (parameters) => {
  return parameters.map((param) => {
    const { kind, name } = param;
    const funcParamValue = `params['${name}']`;
    let output;
    switch (kind) {
      case 'option':
        output = [`if (${funcParamValue}) {`, `    args.push(\`--${name}=\${${funcParamValue}}\`);`, `  }`];
        break;
      case 'flag':
        output = [`if (${funcParamValue}) {`, `    args.push(\`--${name}\`);`, `  }`];
        break;
      case 'argument':
        output = [`  args.push(\`\${${funcParamValue}}\`);`];
    }
    return output;
  });
};

/**
 * Given a command schema generates data used in
 * template function declaration
 * @param {Object} commandSchema
 * @param {String} commandSchema.abstract
 * @param {String} commandSchema.name
 * @param {Array} commandSchema.parameters
 */
const generateFunctionBodyData = (commandSchema) => {
  const { abstract, name, parameters } = commandSchema;
  return {
    __FUNCTION_DOCS__: generateFunctionDocs(abstract, parameters),
    __FUNCTION_NAME__: canonicalFunctionName(name),
    __COMMAND_NAME__: name,
    __COMMAND_PARAMS__: generateCommandParameters(parameters)
      .map((p) => `  ${p.join('\n')}`)
      .join('\n'),
  };
};

/**
 * Given an `amplify-xcode` schema, generates the commonjs
 * exported module declaration
 * @param {Object} schema amplify-xcode schema @see amplify-xcode.json
 */
const generateModuleExports = (schema) => {
  let output = ['module.exports = {'];
  schema.commands.forEach((command) => {
    output.push(`  ${canonicalFunctionName(command.name)},`);
  });
  output.push('};');

  return output;
};

/**
 * Given an `amplify-xcode` schema, generates JS
 * bindings to safely call `amplify-xcode`.
 * @param {Object} schema amplify-xcode schema
 * @param {String} outputPath generated JS bindings file path
 */
const generateNativeBindings = (schema, outputPath) => {
  const preamble = getTemplate('preamble.jst')();
  const functionTemplate = getTemplate('function.jst');
  // generate functions body
  let output = preamble;
  output += schema.commands
    .map((command) => {
      return functionTemplate(generateFunctionBodyData(command));
    })
    .join('');

  // generate exports
  output += '\n' + generateModuleExports(schema).join('\n') + '\n';

  fs.writeFileSync(outputPath, output);
};

module.exports = {
  generateCommandParameters,
  generateFunctionBodyData,
  generateModuleExports,
  generateNativeBindings,
};
