const inquirer = require('inquirer');
const _ = require('lodash');

const defaults = [
  'create',
  'read',
  'update',
  'delete',
];

const crudFlow = async (role, additionalOperations = [], permissionMap = {}) => {
  if (!role) throw new Error('No role provided to permission question flow');
  const possibleOperations = defaults
    .concat(additionalOperations)
    .map((el) => {
      return { name: el, value: el };
    });

  const answers = await inquirer.prompt({
    name: 'permissions',
    type: 'checkbox',
    message: `What kind of access do you want for ${role} users?`,
    choices: possibleOperations,
  });

  return _.uniq(_.flatten(answers.permissions.map(e => permissionMap[e])));
};

module.exports = { crudFlow };
