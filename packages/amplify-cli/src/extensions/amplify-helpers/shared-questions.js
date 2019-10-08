const sharedQuestions = {
  accessLevel: entity => ({
    name: 'accessLevel',
    type: 'list',
    message: `Choose the level of access required to access this ${entity}:`,
    required: true,
    choices: ['Public', 'Private', 'Protected', 'None'],
  }),
};

module.exports = {
  sharedQuestions,
};
