const { generateCommandParameters, generateFunctionBodyData, generateModuleExports } = require('../native-bindings-codegen');

describe('amplify-xcode native bindings codegen', () => {
  describe('should generate command parameters list', () => {
    it('option', () => {
      const param = {
        name: 'option-name',
        kind: 'option',
      };
      const expected = [[`if (params['${param.name}']) {`, `    args.push(\`--${param.name}=\${params['${param.name}']}\`);`, `  }`]];
      expect(generateCommandParameters([param])).toEqual(expected);
    });

    it('flag', () => {
      const param = {
        name: 'flagName',
        kind: 'flag',
      };
      const expected = [[`if (params['${param.name}']) {`, `    args.push(\`--${param.name}\`);`, `  }`]];
      expect(generateCommandParameters([param])).toEqual(expected);
    });

    it('argument', () => {
      const param = {
        name: 'argName',
        kind: 'argument',
      };
      const expected = [["  args.push(`${params['argName']}`);"]];
      expect(generateCommandParameters([param])).toEqual(expected);
    });
  });

  describe('Functions bindings', () => {
    it('should generate functions template data', () => {
      const commandParam = {
        name: 'option-name',
        kind: 'option',
        type: 'String',
        help: 'Option description',
      };
      const commandSchema = {
        name: 'command-name',
        abstract: 'Command abstract',
        parameters: [commandParam],
      };
      const expectedDocs = `
/**
 * ${commandSchema.abstract}
 * @param {Object} params
 * @param {String} params.${commandParam.name} - ${commandParam.help}
 */`;
      const result = generateFunctionBodyData(commandSchema);
      expect(result.__FUNCTION_NAME__).toEqual('commandName');
      expect(result.__FUNCTION_DOCS__).toEqual(expectedDocs);
      expect(result.__COMMAND_NAME__).toEqual(commandSchema.name);
    });

    it('should generate commonjs module exports', () => {
      const command1 = {
        name: 'command-name',
        abstract: 'Command abstract',
      };
      const command2 = {
        name: 'another-command-name',
        abstract: 'Another command abstract',
      };
      const schema = {
        commands: [command1, command2],
      };
      const result = generateModuleExports(schema);
      expect(result).toEqual(['module.exports = {', '  commandName,', '  anotherCommandName,', '};']);
    });
  });
});
