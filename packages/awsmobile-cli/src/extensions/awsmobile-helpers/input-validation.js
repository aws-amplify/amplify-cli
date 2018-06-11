function inputValidation (question) {
  const validator = function(input, answers){
    return new Promise((resolve, reject) => {
      if (!question.validation) {
        resolve(true)
      }
      if (question.validation.operator === 'includes'){
        return input.includes(question.validation.value) ? resolve(true) : reject(question.validation.onErrorMsg);
      }
    })
  }
  // RETURN THE FUNCTION SO IT CAN BE SET AS THE QUESTION'S "VALIDATE" VALUE
  return validator;
}

module.exports = { inputValidation }