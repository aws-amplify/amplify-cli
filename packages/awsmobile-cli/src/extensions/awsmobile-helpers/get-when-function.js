
function getWhen(input) {
  // TODO: Promisify
  const conditionParser = (answers) => {
    let andConditions = true;
    let orConditions = true;

    if (input.andConditions && input.andConditions.length > 0) {
      andConditions = input.andConditions.every(condition => findMatch(condition, answers));
    }

    if (input.orConditions && input.orConditions.length > 0) {
      orConditions = input.orConditions.some(condition => findMatch(condition, answers));
    }

    return andConditions && orConditions;
  };
  // RETURN THE FUNCTION SO IT CAN BE SET AS THE QUESTION'S "WHEN" VALUE
  return conditionParser;
}

// HELPER FUNCTION TO DETERMINE IF A SINGLE CONDITION IS MET BY ANSWERS
const findMatch = (cond, answers) => {
  let response = true;
  if (cond.operator === '=' && (!answers[cond.key] || answers[cond.key] !== cond.value)) {
    response = false;
  } else if (cond.operator === '!=' && (!answers[cond.key] || answers[cond.key] === cond.value)) {
    response = false;
  } else if (cond.operator === 'includes' && (!answers[cond.key] || !answers[cond.key].includes(cond.value))) {
    response = false;
  }

  return response;
};


module.exports = { getWhen };
