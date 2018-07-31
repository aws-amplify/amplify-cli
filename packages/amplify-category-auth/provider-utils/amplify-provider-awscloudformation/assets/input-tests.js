const inputTest = (answers, answerKey, testKey) => {
  console.log('testKey', testKey)
  return testMap[testKey];
}

const testMap = {
  learnMore: (answers, answerKey) => {
    console.log('learnMore index!')
    if (answers[answerKey] === 'learnMore'){
      console.log('answers', answers);
      return false;
    } else {
      return true;
    }
  }
}

module.exports = {inputTest}