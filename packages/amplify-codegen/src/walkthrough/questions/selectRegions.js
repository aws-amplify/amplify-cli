const inquirer = require('inquirer');

const constants = require('../../constants');

async function selectRegions(regions, currentRegion) {
  const regionMap = Object.keys(regions).map(r => ({
    value: r,
    name: regions[r],
  }));
  const answer = await inquirer.prompt([
    {
      name: 'region',
      type: 'list',
      message: constants.PROMPT_MSG_SELECT_REGION,
      choices: regionMap,
      default: currentRegion || null,
    },
  ]);
  return answer.region;
}

module.exports = selectRegions;
