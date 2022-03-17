const inquirer: any = jest.genMockFromModule('inquirer');

function prompt(obj) {
  return obj;
}

inquirer.prompt = prompt;

module.exports = inquirer;
