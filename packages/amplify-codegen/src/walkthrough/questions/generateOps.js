const inquirer = require('inquirer')

const constants = require('../../constants')

async function askGenerateCode() {
  const answer = await inquirer.prompt([
    {
      name: 'confirmGenerateOperations',
      message: constants.PROMPT_MSG_GENERATE_OPS,
      type: 'confirm',
      default: true,
    },
  ])

  return answer.confirmGenerateOperations
}

module.exports = askGenerateCode
