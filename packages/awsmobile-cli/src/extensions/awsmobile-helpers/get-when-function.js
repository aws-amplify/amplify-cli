function getWhen (input) {
  const conditionParser = function(answers){

    let ask = true;

    if (input.conditions && input.conditions.length > 0){
      ask = resolveConditions(input, answers);
    }

    return ask;

  }
  // RETURN THE FUNCTION SO IT CAN BE SET AS THE QUESTION'S "WHEN" VALUE
  return conditionParser;
}

// HELPER FUNCTION THAT AN RECURSIVELY WALK A TREE OF CONDITIONS AND RETURN THE RESULT
const resolveConditions = (input, answers) => {
  let resolved = true;
  // begin iterating over conditions
  input.conditions.forEach((el) => {

    // conditions with a key do not have a sub-tree... thus we see if it is met by answers
    if (el.key){
      resolved = findMatch(el, answers)
    } else {
      // conditions with an && operator are only met if all of their children are also met... thus we make recursive call
      if (el.operator == '&&'){
        resolved = resolveConditions(el, answers);
      }
      if (el.operator == '||'){
        resolved =  el.conditions.some((i) => {
          if (i.key){
            return findMatch(i, answers);
          } else {
            return resolveConditions(i, answers)
          }
        })
      }
     
    }
  });
  return resolved;
}


// HELPER FUNCTION TO DETERMINE IF A SINGLE CONDITION IS MET BY ANSWERS
const findMatch = (cond, answers) => {
  let response = true;
  if (cond.operator === '=' && (!answers[cond.key] || answers[cond.key] !== cond.value)){
    response = false;
  }
  if (cond.operator === '!=' && (!answers[cond.key] || answers[cond.key] === cond.value)){
    response = false;
  }

  return response;

}


module.exports = { getWhen }