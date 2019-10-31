const inquirer = require('inquirer');
const _ = require('lodash');

const crudFlow = async (role, permissionMap = {}, defaults = []) => {
  if (!role) throw new Error('No role provided to permission question flow');
  const possibleOperations = Object.keys(permissionMap).map(el => ({ name: el, value: el }));

  const answers = await inquirer.prompt({
    name: 'permissions',
    type: 'checkbox',
    message: `What kind of access do you want for ${role} users?`,
    choices: possibleOperations,
    default: defaults,
    validate: inputs => {
      if (inputs.length === 0) {
        return 'Select at least one option';
      }
      return true;
    },
  });

  return _.uniq(_.flatten(answers.permissions.map(e => permissionMap[e])));
};

module.exports = { crudFlow };
