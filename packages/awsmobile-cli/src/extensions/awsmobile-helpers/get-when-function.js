
function getWhen (input) {
  const conditionParser = function(answers){

    let andConditions = true;
    let orConditions = true;

    if (input.andConditions && input.andConditions.length > 0) {
      andConditions = input.andConditions.every((i) => {
        return findMatch(i, answers)
      })
    }

    if (input.orConditions && input.orConditions.length > 0) {
      orConditions = input.orConditions.some((i) => {
        return findMatch(i, answers)
      })
    }

    return andConditions && orConditions;

  }
  // RETURN THE FUNCTION SO IT CAN BE SET AS THE QUESTION'S "WHEN" VALUE
  return conditionParser;
}

// HELPER FUNCTION TO DETERMINE IF A SINGLE CONDITION IS MET BY ANSWERS
const findMatch = (cond, answers) => {

  let response = true;
  if (cond.operator === '=' && (!answers[cond.key] || answers[cond.key] != cond.value)){
    response = false;
  }
  if (cond.operator === '!=' && (!answers[cond.key] || answers[cond.key] == cond.value)){
    response = false;
  }
  if (cond.operator === 'includes' && (!answers[cond.key] || !answers[cond.key].includes(cond.value))){
    response = false;
  }

  return response;
}


module.exports = { getWhen }